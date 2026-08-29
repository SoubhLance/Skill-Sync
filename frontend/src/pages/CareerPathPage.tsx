import React, { useState } from 'react';
import { 
  Compass, 
  GraduationCap, 
  Briefcase, 
  UploadCloud, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Target, 
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface MilestoneStep {
  stepNumber: number;
  title: string;
  duration: string;
  description: string;
  skillsToLearn: string[];
  deliverables: string[];
}

const STUDENT_MOCK_ROADMAP: MilestoneStep[] = [
  {
    stepNumber: 1,
    title: "Core ML Signal & DSA Foundations",
    duration: "Weeks 1–4",
    description: "Strengthen algorithmic problem solving and core PyTorch model training pipelines.",
    skillsToLearn: ["PyTorch Tensor Operations", "FastAPI Microservices", "PostgreSQL & Vector DBs"],
    deliverables: ["Solve 50 LeetCode Mediums", "Deploy end-to-end ML classification API on GitHub"]
  },
  {
    stepNumber: 2,
    title: "Distributed Computing & Scale",
    duration: "Weeks 5–8",
    description: "Build microservices with Docker and implement parallel data loading for large models.",
    skillsToLearn: ["Docker Containerization", "Redis Caching", "Distributed Training (DDP)"],
    deliverables: ["Containerized model inference service", "Open-source contribution to ML tooling"]
  },
  {
    stepNumber: 3,
    title: "Production LLM & Career Portfolio",
    duration: "Weeks 9–12",
    description: "Fine-tune open weights LLMs with vLLM/Triton and package portfolio for top tech referrals.",
    skillsToLearn: ["vLLM / HuggingFace TGI", "RAG Pipeline Optimization", "System Architecture Design"],
    deliverables: ["Deployed RAG application demo", "Resume & GitHub profile optimization for ML Engineer role"]
  }
];

const PRO_MOCK_ROADMAP: MilestoneStep[] = [
  {
    stepNumber: 1,
    title: "Legacy-to-ML System Transition",
    duration: "Month 1",
    description: "Bridge backend engineering experience with modern deep learning and MLOps infrastructure.",
    skillsToLearn: ["PyTorch Distributed", "ONNX Runtime", "MLflow / Weights & Biases"],
    deliverables: ["Migrated REST API to async PyTorch inference engine", "Set up automated model tracking"]
  },
  {
    stepNumber: 2,
    title: "High-Throughput Serving & Triton",
    duration: "Month 2",
    description: "Optimize inference latencies for LLM serving using TensorRT-LLM and Triton Inference Server.",
    skillsToLearn: ["Triton C++ Backend", "CUDA Basics", "Kubernetes Deployment"],
    deliverables: ["Benchmark <20ms p99 latency pipeline", "Kubernetes cluster configuration repo"]
  },
  {
    stepNumber: 3,
    title: "Staff/Principal Level System Design",
    duration: "Month 3",
    description: "Lead end-to-end AI architecture, cost-performance optimization, and team mentoring.",
    skillsToLearn: ["Distributed System Tradeoffs", "Model Quantization (AWQ/GPTQ)", "Cost Estimation"],
    deliverables: ["Production AI Architecture RFC", "Senior ML Staff Promotion Package"]
  }
];

export const CareerPathPage: React.FC = () => {
  const [audience, setAudience] = useState<'student' | 'pro'>('student');
  const [targetRole, setTargetRole] = useState('Senior ML & Distributed Systems Engineer');
  const [fileUploaded, setFileUploaded] = useState(true);

  const roadmap = audience === 'student' ? STUDENT_MOCK_ROADMAP : PRO_MOCK_ROADMAP;
  const skillGaps = audience === 'student'
    ? ["Distributed PyTorch", "Docker Containerization", "vLLM Serving", "Vector Databases"]
    : ["Triton C++ Backend", "TensorRT-LLM", "Kubernetes Orchestration", "Model Quantization"];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans text-[var(--text-main)]">
      {/* Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <Compass className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync career-path --recommended
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            Personalized Career Path Engine
          </h1>
        </div>

        {/* Audience Toggle Bar */}
        <div className="flex p-0.5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
          <button
            onClick={() => setAudience('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-sm transition-all ${
              audience === 'student'
                ? 'btn-accent shadow-sm'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> College Student
          </button>
          <button
            onClick={() => setAudience('pro')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-sm transition-all ${
              audience === 'pro'
                ? 'btn-accent shadow-sm'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Working Professional
          </button>
        </div>
      </div>

      {/* Target Alignment Summary Box */}
      <div className="p-6 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
              [TARGET ROLE ALIGNMENT]
            </span>
            <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--accent-color)]" /> {targetRole}
            </h2>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span className="text-xs text-[var(--text-muted)]">Track: {audience === 'student' ? 'Skill Building' : 'Career Transition'}</span>
            <span className="px-3 py-1 bg-[#DAFBE1] text-[#1A7F37] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] border border-[#2DA44E]/30 rounded-sm font-bold text-xs">
              92% Alignment
            </span>
          </div>
        </div>

        {/* Skill Gaps List */}
        <div className="space-y-2 font-mono text-xs">
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Critical Skill Gaps to Bridge ({skillGaps.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {skillGaps.map((gap, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-sm bg-[#FFEBE9] text-[#CF222E] dark:bg-[#CF222E]/20 dark:text-[#CF222E] border border-[#CF222E]/30 font-semibold"
              >
                - {gap}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sequential Milestone Roadmap Steps */}
      <div className="space-y-6">
        <div className="flex items-center justify-between font-mono">
          <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider">
            [RECOMMENDED MILESTONE ROADMAP]
          </span>
          <span className="text-xs text-[var(--text-muted)]">3 Phases • {audience === 'student' ? '12 Weeks' : '3 Months'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {roadmap.map((step) => (
            <div
              key={step.stepNumber}
              className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4 flex flex-col justify-between hover:border-[var(--accent-color)] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
                  <span className="font-bold text-[var(--accent-color)] text-xs">
                    STEP 0{step.stepNumber}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-paper)] px-2 py-0.5 border border-[var(--border-hairline)] rounded-sm">
                    {step.duration}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-[var(--text-main)] font-sans leading-tight">
                  {step.title}
                </h3>

                <p className="text-[11px] font-sans text-[var(--text-muted)] leading-relaxed">
                  {step.description}
                </p>

                {/* Skills to Learn */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Focus Skills:</div>
                  <div className="space-y-1">
                    {step.skillsToLearn.map((skill, sIdx) => (
                      <div key={sIdx} className="text-[#1A7F37] dark:text-[#2DA44E] bg-[#DAFBE1] dark:bg-[#2DA44E]/10 px-2 py-0.5 border border-[#2DA44E]/30 rounded-sm text-[11px]">
                        + {skill}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverables */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Key Deliverables:</div>
                  <ul className="list-disc list-inside text-[11px] text-[var(--text-muted)] font-sans space-y-0.5">
                    {step.deliverables.map((del, dIdx) => (
                      <li key={dIdx}>{del}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
