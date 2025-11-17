// app/api/analyze-call/route.ts
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { analyzeCallFromAssembly } from "@/lib/callMetrics";
import { analyzeAgentBehaviorWithLLM } from "@/lib/agentBehaviorLLM";

export const runtime = "nodejs";

const ASSEMBLY_ENDPOINT_UPLOAD = "https://api.assemblyai.com/v2/upload";
const ASSEMBLY_ENDPOINT_TRANSCRIPT = "https://api.assemblyai.com/v2/transcript";

interface TranscriptionResult {
  status: "completed" | "processing" | "queued" | "error";
  text: string | null;
  words: {
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string | null;
  }[];
  sentiment_analysis_results: {
    text: string;
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    confidence: number;
    start: number;
    end: number;
    speaker: string | null;
  }[] | null;
  error?: string;
  [key: string]: any;
}

async function uploadToAssemblyAI(
    fileBuffer: ArrayBuffer,
    apiKey: string
): Promise<string> {
  const res = await fetch(ASSEMBLY_ENDPOINT_UPLOAD, {
    method: "POST",
    headers: {
      Authorization: apiKey,
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Upload error:", text);
    throw new Error("Failed to upload audio to AssemblyAI");
  }

  const data = await res.json();
  return data.upload_url as string;
}

async function requestTranscription(
    audioUrl: string,
    apiKey: string
): Promise<string> {
  const res = await fetch(ASSEMBLY_ENDPOINT_TRANSCRIPT, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true,
      sentiment_analysis: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Transcription request error:", text);
    throw new Error("Failed to create transcription");
  }

  const data = await res.json();
  return data.id as string;
}

async function waitForTranscription(
    id: string,
    apiKey: string
): Promise<TranscriptionResult> {
  while (true) {
    const res = await fetch(`${ASSEMBLY_ENDPOINT_TRANSCRIPT}/${id}`, {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Polling error:", text);
      throw new Error("Failed to poll transcription status");
    }

    const data = await res.json();

    if (data.status === "completed") {
      return data as TranscriptionResult;
    }

    if (data.status === "error") {
      console.error("AssemblyAI error:", data.error);
      throw new Error(`Transcription failed: ${data.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return new NextResponse("ASSEMBLYAI_API_KEY is not set", { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return new NextResponse("No audio file provided", { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // 1) Upload to AssemblyAI
    const uploadUrl = await uploadToAssemblyAI(arrayBuffer, apiKey);

    // 2) Create transcription job
    const transcriptId = await requestTranscription(uploadUrl, apiKey);

    // 3) Wait until completed
    const transcriptJson = await waitForTranscription(transcriptId, apiKey);

    // 4) Equation-based metrics (WPM, talk ratio, etc.)
    const metrics = analyzeCallFromAssembly({
      text: transcriptJson.text,
      words: transcriptJson.words,
      sentiment_analysis_results: transcriptJson.sentiment_analysis_results,
    });

    // 5) LLM-based soft-skill scores + descriptions (optional)
    let behaviorMetrics = null;
    try {
        behaviorMetrics = await analyzeAgentBehaviorWithLLM(
            metrics.agent.transcript,
            metrics.customer.transcript
        );
    } catch (e) {
        console.error("LLM-based analysis failed, but continuing...", e);
        // This part is optional, so we don't throw an error
    }

    // 6) Save everything in /logs (DISABLED)
    // const logsDir = path.join(process.cwd(), "logs");
    // await fs.mkdir(logsDir, { recursive: true });
    // const logFile = path.join(logsDir, `analysis-${transcriptId}.json`);
    // await fs.writeFile(
    //     logFile,
    //     JSON.stringify(
    //         {
    //           transcriptId,
    //           transcript: transcriptJson,
    //           metrics,
    //           behaviorMetrics, // will be null if it failed
    //         },
    //         null,
    //         2
    //     )
    // );

    // 7) Return JSON to frontend
    return NextResponse.json({
      message: "Analysis complete",
      filename: `analysis-${transcriptId}.json`,
      metrics,
      behaviorMetrics, // will be null if it failed
      transcript: transcriptJson,
    });
  } catch (err: unknown) {
    console.error(err);
    const message =
        err instanceof Error ? err.message : "Error while analyzing call";
    return new NextResponse(message, { status: 500 });
  }
}
