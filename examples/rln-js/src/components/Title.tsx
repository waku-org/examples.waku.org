type TitleProps = {
  children: any;
  className?: string;
};

export const Title: React.FunctionComponent<TitleProps> = (props) => (
  <h1 className={`text-4xl ${props.className || ""}`}>{props.children}</h1>
);
