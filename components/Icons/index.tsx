import React from 'react';
import './DmpIcon.scss';


interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: string;
  classes?: string;
  fill?: string;
  width?: string | number;
  height?: string | number;
}

export function DmpIcon({
  icon,
  classes = '',
  fill = "#5f6368",
  width = "24px",
  height = "24px",
  ...rest
}: IconProps) {
  return (
    <svg
      data-testid="dmpIconSvg"
      className={`dmp-icon icon-${icon} ${classes}`}
      width={width}
      height={height}
      fill={fill}
      aria-hidden="true" // hide from screen readers, as the icon is decorative and not informative
      {...rest}
    >
      <use
        href={`/icons/iconset.svg#icon-${icon}`}
        data-testid="dmpIconSvgUse"
      />
    </svg>
  )
}
