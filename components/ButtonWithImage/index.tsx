'use client'

import React from 'react'
import Image from 'next/image';
import Link from 'next/link';
import { Button } from 'react-aria-components';
import styles from './buttonWithImage.module.scss';

interface ButtonWithImageProps {
  url?: string;
  imageUrl?: string;
  buttonText: string;
  onPress?: () => void;
}

const ButtonWithImage: React.FC<ButtonWithImageProps> = ({
  url,
  imageUrl,
  buttonText,
  onPress
}) => {
  const content = (
    <>
      {imageUrl && (
        <Image src={imageUrl} className={styles.icon} width={20} height={20} alt="" />
      )}
      {buttonText}
    </>
  );

  if (onPress) {
    return (
      <Button
        className={`${styles.imageButton} react-aria-Button`}
        onPress={onPress}
      >
        {content}
      </Button>
    );
  }

  return (
    <Link href={url ?? '#'} className={`${styles.imageButton} react-aria-Button`} role="button">
      {content}
    </Link>
  );
};

export default ButtonWithImage;