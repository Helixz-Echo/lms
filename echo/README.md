# Echo Assistant Training

Echo Assistant Training is a powerful, AI-driven platform designed to train and assess customer service agents. This application leverages a Retrieval-Augmented Generation (RAG) architecture to create a dynamic learning environment where agents can be evaluated based on a custom knowledge base.

## Features

- **Role-Based Access Control:** Separate interfaces for `admin` and `trainer` roles.
- **Dynamic Knowledge Base:** Upload CSV documents to create a customized knowledge base for training.
- **AI-Powered Assessments:** Automatically generate assessments and quizzes based on the uploaded content.
- **Performance Feedback:** Provides detailed feedback on agent performance.
- **Interactive Chat:** An interactive chat interface for a more engaging learning experience.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Database:** [Supabase](https://supabase.io/)
- **AI Orchestration:** [LangChain](https://js.langchain.com/)
- **Embeddings:** [Hugging Face](https://huggingface.co/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Yarn
- Supabase Account and Project
- Hugging Face API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/echo-assistant-training.git
   cd lms/echo
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root of the project and add the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   HUGGINGFACE_API_KEY=your-huggingface-api-key
   ```

4. **Set up the database:**
   Run the SQL schema to set up the necessary tables and policies in your Supabase project.
   ```sql
   -- Found in sql/schema.sql
   ```

5. **Run the development server:**
   ```bash
   yarn dev
   ```

## Usage

- Access the admin dashboard at `/dashboard/admin` to manage documents and training sessions.
- Access the trainer dashboard at `/dashboard/trainer` to view training materials and assessments.

## Project Structure

```
/
├── app/                # Next.js App Router
│   ├── (open)/         # Open routes
│   ├── api/            # API routes
│   └── dashboard/      # Protected routes
├── config/             # Project configuration
├── hooks/              # React hooks
├── lib/                # Core application logic
│   ├── ai/             # AI-related modules
│   ├── assessment/     # Assessment generation
│   ├── database/       # Supabase client
│   └── prompts/        # AI prompts
├── modules/            # UI components
├── public/             # Static assets
└── sql/                # Database schema
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## License

This project is licensed under the MIT License.