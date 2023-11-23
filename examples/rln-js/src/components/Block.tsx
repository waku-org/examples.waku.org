export enum BlockTypes {
  FlexHorizontal = "flex-horizontal",
}

type BlockProps = {
  children: any;
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
    <div className={`${flexClassNames} ${restClassNames}`}>
      {props.children}
    </div>
  );
};
