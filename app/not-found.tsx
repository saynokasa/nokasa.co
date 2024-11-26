import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-100 text-center p-4">
      <h1 className="text-5xl font-bold text-green-800 mb-4">Oops!</h1>
      <h2 className="text-3xl font-bold text-green-800 mb-4">Page Not Found</h2>
      <p className="text-lg text-green-600 mb-8">
        We can&apos;t seem to find the page you&apos;re looking for. Let&apos;s help you get back on track!
      </p>
      <Link href="/" className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition">
          Go back to Home
      </Link>
    </div>
  );
};

