import * as React from 'react';
import clx from 'classnames';

import * as styles from './styles.module.less';

const PureInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  { className, autoFocus, ...restProps },
  ref: React.MutableRefObject<HTMLInputElement>,
) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  React.useImperativeHandle(ref, () => inputRef.current!);

  return (
    <input
      type='text'
      className={clx(styles.input, className)}
      ref={inputRef}
      autoFocus={autoFocus}
      spellCheck={false}
      autoCapitalize='off'
      autoCorrect='off'
      {...restProps}
    />
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(PureInput);

export const CheckBox: React.FC<{
  id: string,
  insertClass?: string;
  label?: string,
  [key: string]: any;
}> = ({ insertClass, label, id, ...restProps }) => {
  return <span className={clx(styles.checkbox_wrap, insertClass)} >
    <input {...restProps} className={clx(styles.checkbox)} id={id} type='checkbox'/>
    <label htmlFor={id}>{label || ''}</label>
  </span>;
};
