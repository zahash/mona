import { Component } from 'solid-js';
import { Title } from '@solidjs/meta';

import styles from './Home.module.css';

const links = [
  { name: "GitHub", href: "https://github.com/zahash/" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/zahash/" },
  { name: "Email", href: "mailto:zahash.z@gmail.com" },
  { name: "Resume", href: "/resume.pdf" }
];

const projects = [
  { name: "jsoncodegen", link: "/jsoncodegen", img: "https://repository-images.githubusercontent.com/835807491/1c3f871c-7b3d-475e-8577-999ec870b44e" },
  { name: "utf8.c", link: "https://github.com/zahash/utf8.c", img: "https://repository-images.githubusercontent.com/773322954/69bc35ce-e571-46d7-a1cb-25f0df30015e" },
  { name: "quarantine", link: "https://github.com/zahash/quarantine", img: "https://repository-images.githubusercontent.com/861012829/3203848d-13ff-4e02-a9f9-2121352b7fc4" },
  { name: "reactivate", link: "https://github.com/zahash/reactivate", img: "https://repository-images.githubusercontent.com/665972798/5c6f3ce4-6a80-4f51-b623-f96457b47afd" },
  { name: "royalguard", link: "https://github.com/zahash/royalguard", img: "https://repository-images.githubusercontent.com/696733418/f0c12dea-6fd0-46c3-b634-211f1861d792" },
  { name: "csc", link: "https://github.com/zahash/csc", img: "https://repository-images.githubusercontent.com/703878154/ab3138be-5267-4638-9ffc-80509547d6c3" },
  { name: "amnis", link: "https://github.com/zahash/amnis", img: "https://repository-images.githubusercontent.com/441825617/1a217e8e-07b9-4ef6-8b41-5dccc6a8d344" },
];

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
            href={proj.link}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
          >
            <img src={proj.img} alt={proj.name} class={styles.Img}></img>
          </a>
        );
      })}
    </div>
  </>;
};

export default Home;
