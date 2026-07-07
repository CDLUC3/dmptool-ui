import Image from "next/image";
import styles from "./footer.module.scss";

function Footer() {
  return (
    <>
      <footer className={styles.footerWrapper}>
        <div className={styles["footer-links"]}>
          <div className={`${styles["dmpui-frontend-container"]} ${styles["dmpui-frontend"]}`}>
            <div className={styles["footer-links-grid"]}>
              <div className={styles["footer-links-logo"]}>
                <Image
                  src="/images/DMP-White-Landscape.svg"
                  className={styles.icon}
                  width={230}
                  height={33}
                  alt="DMP Tool"
                />
                <p>
                  <a
                    href="#"
                    className={`${styles["dmpui-frontend-btn"]} ${styles["dmpui-frontend-btn-secondary"]} ${styles["with-mark"]}`}
                  >
                    Get Started
                  </a>
                </p>
              </div>

              <div className={styles["footer-links-quicklinks"]}>
                <h4>Quick links</h4>
                <ul>
                  <li>
                    <a href="">Funder Requirements</a>
                  </li>
                  <li>
                    <a href="">Public Plans</a>
                  </li>
                  <li>
                    <a href="">Help</a>
                  </li>
                  <li>
                    <a href="">Terms & Privacy</a>
                  </li>
                  <li>
                    <a href="/contact">Contact</a>
                  </li>
                  <li>
                    <a href="">Login</a>
                  </li>
                </ul>
              </div>

              <div className={styles["footer-links-external"]}>
                <h4>External links</h4>
                <ul>
                  <li>
                    <a
                      href="https://github.com/cdluc3/dmptool/wiki"
                      target="_blank"
                      rel="noreferrer"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://blog.dmptool.org"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.cdlib.org/about/accessibility.html"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Accessibility
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className={styles["footer-disclaimers"]}>
          <div className={`${styles["dmpui-frontend-container"]} ${styles["dmpui-frontend"]}`}>
            <div className={styles["footer-disclaimers-grid"]}>
              <div className={styles["footer-disclaimers-logo"]}>
                <Image
                  alt="University of California, Office of the President (UCOP) logo"
                  width="104"
                  height="39"
                  src="/images/logo-cdl.png"
                  priority /*to preload large image */
                />
              </div>
              <div className={styles["footer-disclaimers-text"]}>
                <p>
                  DMP Tool is a service of the California Digital Library, a division of the University of California
                  Office of the President.
                  <br />
                  Copyright &copy; {new Date().getFullYear()} The Regents of the University of California
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
