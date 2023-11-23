type SubtitleProps = {
  children: any;
  className?: string;
};

export const Subtitle: React.FunctionComponent<SubtitleProps> = (props) => (
  <h2 className={`text-2xl ${props.className || ""}`}>{props.children}</h2>
);
