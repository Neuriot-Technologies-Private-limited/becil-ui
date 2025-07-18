
import React from "react";

type CustomToastProps = {
  status: string;
  data?: string;
};

const CustomToast: React.FC<CustomToastProps> = ({ status, data }) => {
  return (
    <div className="flex flex-col gap-4 text-neutral-400 rounded-lg bg-neutral-900 w-72 toast-shadow p-4 overflow-hidden text-sm">
      <div className="flex flex-col gap-1">
        <p className="text-white">{status}</p>
        {data && <p className="truncate">{data}</p>}
      </div>
    </div>
  );
};

export default CustomToast;
