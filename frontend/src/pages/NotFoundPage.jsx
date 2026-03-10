import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#111110] flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="font-serif text-[2rem] text-[#e8e6e0] tracking-tight leading-none mb-10">
          di<span className="text-[#d4a843] italic">sh</span>
        </div>

        {/* Error block */}
        <div className="border-l-2 border-[#d4a843] pl-5 mb-10">
          <div className="font-mono text-[0.65rem] text-[#6b6b67] uppercase tracking-widest mb-1">
            error / 404
          </div>
          <h1 className="font-serif text-3xl text-[#e8e6e0] leading-tight mb-2">
            Page not found.
          </h1>
          <p className="text-sm text-[#6b6b67] font-light leading-relaxed">
            This route doesn't exist. Maybe it was moved,
            deleted, or you typed the wrong path.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-[#1a1a18] border border-[#2e2e2b] text-[#a8a6a0] font-mono text-[0.78rem] tracking-wide px-4 py-2.5 rounded-md hover:border-[#6b6b67] hover:text-[#e8e6e0] transition-colors"
          >
            ← go back
          </button>
          <button
            onClick={() => navigate('/discover', { replace: true })}
            className="bg-[#d4a843] text-[#111110] font-mono text-[0.78rem] font-medium tracking-wider px-4 py-2.5 rounded-md hover:opacity-85 transition-opacity"
          >
            go to discover →
          </button>
        </div>

        {/* Decorative path */}
        <div className="mt-10 font-mono text-[0.63rem] text-[#2e2e2b] tracking-widest select-none">
          {window.location.pathname}
        </div>

      </div>
    </div>
  )
}
