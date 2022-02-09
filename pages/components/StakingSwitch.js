import * as React from 'react';
import clsx from 'clsx';
import { styled } from '@mui/system';
import { useSwitch } from '@mui/base/SwitchUnstyled';
import Typography from '@mui/material/Typography';

const blue = {
  700: '#0059B2',
};

const grey = {
  400: '#BFC7CF',
  800: '#2F3A45',
};

const SwitchRoot = styled('span')`
  display: inline-block;
  position: relative;
  width: 256px;
  height: 72px;
`;

const SwitchInput = styled('input')`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  z-index: 1;
  margin: 0;
  cursor: pointer;
`;

const SwitchThumb = styled('span')`
  position: absolute;
  display: table;
  background-color: ${blue[700]};
  width: 120px;
  height: 60px;
  border-radius: 16px;
  top: 6px;
  left: 8px;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  line-height: 60px;


  &.focusVisible {
    background-color: #79b;
  }

  &.checked {
    transform: translateX(120px);
  }
`;

const SwitchTrack = styled('span')(
  ({ theme }) => `
  background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[400]};
  border-radius: 8px;
  width: 100%;
  height: 100%;
  display: block;
`,
);

const SwitchContent = styled('span')(
  ({ theme }) => `
  display: table-cell;
  vertical-align: middle;
  font-size: 32px;
  font-family: fantasy;
  color: white;
`,
);

export default function MUISwitch(props) {
  const { getInputProps, checked, disabled, focusVisible } = useSwitch(props);

  const stateClasses = {
    checked,
    disabled,
    focusVisible,
  };

  return (
    <SwitchRoot className={clsx(stateClasses)}>
      <SwitchTrack>
        <SwitchThumb className={clsx(stateClasses)}>
          <SwitchContent>{checked ? "Unstake" : "Stake"}</SwitchContent>
        </SwitchThumb>
      </SwitchTrack>
      <SwitchInput {...getInputProps()} aria-label="Demo switch" />
    </SwitchRoot>
  );
}
