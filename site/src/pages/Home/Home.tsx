import { Component, createResource, Show } from 'solid-js';
import { Title } from '@solidjs/meta';

import styles from './Home.module.css';

const links = [
  { name: "GitHub", href: "https://github.com/zahash/" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/zahash/" },
  { name: "Email", href: "mailto:zahash.z@gmail.com" },
  { name: "Resume", href: "/resume.pdf" }
];

const projects = [
  { name: "jsoncodegen", link: "/jsoncodegen" },
  { name: "utf8.c", link: "https://github.com/zahash/utf8.c" },
  { name: "quarantine", link: "https://github.com/zahash/quarantine" },
  { name: "reactivate", link: "https://github.com/zahash/reactivate" },
  { name: "royalguard", link: "https://github.com/zahash/royalguard" },
  { name: "csc", link: "https://github.com/zahash/csc" },
  { name: "amnis", link: "https://github.com/zahash/amnis" },
];

const fetchAscii = async (name: string) => {
  const response = await fetch(`/ascii-art/${name}.txt`);
  return response.text();
};

const AsciiArt: Component<{ name: string }> = (props) => {
  const [ascii] = createResource(() => props.name, fetchAscii);

  return (
    <Show when={ascii()}>
      <pre class={styles.Ascii}>{ascii()}</pre>
    </Show>
  );
};

const Home: Component = () => {
  return <>
    <Title>zahash</Title>
    <div class={styles.Home}>
      <header class={styles.Header}>
        <h1 class={styles.Name}>zahash</h1>
        {links.map(link =>
          <a class={["link", styles.Link].join(' ')} href={link.href} target="_blank" rel="noopener noreferrer">{link.name}</a>
        )}
        <p>Love writing software of all shapes and sizes</p>
      </header>

      {projects.map(proj => {
        const isInternal = proj.link.startsWith("/");

        return (
          <a
            class={styles.ProjectLink}
            href={proj.link}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
          >
            <AsciiArt name={proj.name} />
          </a>
        );
      })}
    </div>
  </>;
};

export default Home;
