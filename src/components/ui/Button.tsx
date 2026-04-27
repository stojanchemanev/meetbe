export const Button: React.FC<{
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
}> = ({
    children,
    variant = "primary",
    className = "",
    onClick,
    disabled,
    type = "button",
}) => {
    const baseStyles =
        "px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2";
    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        outline:
            "border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary-200",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        ghost: "bg-transparent text-gray-600 hover:bg-primary-50 hover:text-primary-600",
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};
