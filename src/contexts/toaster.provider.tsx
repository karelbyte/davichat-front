import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ReactNode } from "react";

function ToasterProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <ToastContainer />
      {children}
    </>
  );
}

export default ToasterProvider;
