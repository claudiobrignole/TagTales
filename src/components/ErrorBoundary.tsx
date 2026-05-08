import React, { Component, ErrorInfo, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F2EEE8] flex flex-col items-center justify-center p-6 text-center">
          <span className="font-['Shamgod'] text-[150px] leading-none text-[#FF4F00] block mb-4 uppercase">
            Ops
          </span>
          <h1 className="font-['Shamgod'] text-4xl text-[#121212] uppercase mb-4 leading-none">
            Qualcosa è andato storto
          </h1>
          <p className="font-['Karla'] text-lg text-[#59554E] mb-10 max-w-md mx-auto">
            Si è verificato un errore inaspettato. Il nostro team è stato notificato.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block bg-[#121212] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-[#FF4F00] transition-colors"
          >
            Ricarica Pagina
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundaryClass;
