interface ProgressBarProps {
  progress: number;
  message?: string;
}

export default function ProgressBar({ progress, message }: ProgressBarProps) {
  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              {message || 'Processando'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
          <div 
            style={{ width: `${progress}%` }} 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300 ease-in-out"
          ></div>
        </div>
      </div>
    </div>
  );
}
