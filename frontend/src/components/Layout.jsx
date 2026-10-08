export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#2c3440]">
      {/* Centered White Card Canvas matching screenshots */}
      <main className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/90 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
