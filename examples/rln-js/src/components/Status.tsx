type StatusProps = {
  text: string;
  mark: string;
};

export const Status: React.FunctionComponent<StatusProps> = (props) => (
  <p className="text-s">
    {props.text}:{" "}
    <span className="underline underline-offset-3 decoration-4 decoration-blue-400 dark:decoration-blue-600">
      {props.mark}
    </span>
  </p>
);
