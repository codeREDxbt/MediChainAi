import toast from "react-hot-toast";

export function useToast() {
  const success = (message: string) => {
    toast.success(message);
  };

  const error = (message: string) => {
    toast.error(message);
  };

  const loading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = () => {
    toast.dismiss();
  };

  return {
    success,
    error,
    loading,
    dismiss,
  };
}
