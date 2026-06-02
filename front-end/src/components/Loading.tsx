export default function Loading() {
  return (
    <div className="w-full h-full space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-3">
          <div className="h-3 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-10 w-64 bg-gray-300 rounded-xl"></div>
        </div>
        <div className="h-12 w-44 bg-gray-200 rounded-full hidden md:block"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-white rounded-md border border-gray-100 shadow-sm"
          ></div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-100 min-h-99]">
        <div className="flex justify-between items-center mb-10">
          <div className="h-7 w-48 bg-gray-200 rounded-full"></div>
          <div className="h-11 w-36 bg-[#A855F7]/10 rounded-full"></div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-5 gap-4 px-4 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded-full w-20"></div>
            ))}
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-50/50 rounded-xl w-full border border-gray-50"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
