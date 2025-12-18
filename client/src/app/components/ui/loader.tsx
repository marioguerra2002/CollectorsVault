import React from 'react';
import styles from './loader.module.css';
const Loader = () => {
  return (
    <div className={styles.card}>
      <div className={styles.loader}>
        <p> loading</p>
        <div className={styles.words}>
          <span className={styles.word}>cards</span>
          <span className={styles.word}>trainers</span>
          <span className={styles.word}>energies</span>
          <span className={styles.word}>pokemons</span>
          <span className={styles.word}>arceus</span>
        </div>
      </div>
    </div>
  );
};
export default Loader;
