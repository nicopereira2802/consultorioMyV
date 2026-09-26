export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#2B2D31] flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 md:p-8">
      {/* Centered White Card Canvas matching screenshots */}
      <main className="w-full max-w-5xl lg:max-w-6xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/90 p-5 sm:p-8 md:p-10 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
