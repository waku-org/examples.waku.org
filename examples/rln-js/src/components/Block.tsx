export enum BlockTypes {
  FlexHorizontal = "flex-horizontal",
}

type BlockProps = {
  children: any;
  top?: string;
  bottom?: string;
  type?: BlockTypes;
  className?: string;
};

export const Block: React.FunctionComponent<BlockProps> = (props) => {
  const flexClassNames =
    props.type === BlockTypes.FlexHorizontal
      ? "items-center justify-between lg:flex"
      : "";
  const restClassNames = props.className || "";

  return (
    <div
      className={`mt-${props.top || 0} mb-${
        props.bottom || 0
      } ${flexClassNames} ${restClassNames}`}
    >
      {props.children}
    </div>
  );
};
