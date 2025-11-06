import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const model = process.env.HF_EMBEDDINGS_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';

export async function embed(texts: string[]): Promise<number[][]> {
    const response = await hf.featureExtraction({
        model,
        inputs: texts,
    });

    console.log("Hugging Face API response:", response);

    if (!Array.isArray(response) || !response.every(Array.isArray)) {
        throw new Error('Invalid response from Hugging Face API');
    }

    return response as number[][];
}
