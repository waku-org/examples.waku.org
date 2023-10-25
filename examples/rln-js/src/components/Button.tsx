type ButtonProps = {
  children: any;
  top?: string;
  left?: string;
  onClick?: (e?: any) => void;
};

export const Button: React.FunctionComponent<ButtonProps> = (props) => (
  <button
    onClick={props.onClick}
    className={`ml-${props.left || 0} mt-${
      props.top || 0
    } py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700`}
  >
    {props.children}
  </button>
);
