import { Component, onMount } from "solid-js";
import { Title } from "@solidjs/meta";

import init, { codegen, Lang } from '@/lib/jsoncodegen/jsoncodegen_web';

import styles from './JsonCodeGen.module.css';

const JsonCodeGen: Component = () => {
    onMount(async () => await init());

    let langSelectRef: HTMLSelectElement;
    let jsonInputRef: HTMLTextAreaElement;
    let codeOutputRef: HTMLTextAreaElement;

    const onClick = () => {
        const lang = Lang[langSelectRef.value as keyof typeof Lang];
        const json = jsonInputRef.value;

        try {
            codeOutputRef.value = codegen(json, lang);
        } catch (e) {
            codeOutputRef.value = `Error: ${e}`;
            console.error(e);
        }
    }

    return <>
        <Title>Json Code Generator</Title>
        <div class={styles.JsonCodeGen}>
            <div class={styles.Header}>
                <h3>JSON Code Generator <a href="https://github.com/zahash/jsoncodegen" class="link">GitHub</a></h3>
                <div>
                    <label for="lang-select">Language: </label>
                    <select ref={ele => langSelectRef = ele} id="lang-select" class={styles.LangSelect}>
                        <option value="Java">Java</option>
                        <option value="Rust">Rust</option>
                    </select>
                    <button onClick={onClick} class={styles.GenerateBtn}>Generate</button>
                </div>
            </div>

            <div class={styles.Main}>
                <textarea ref={ele => jsonInputRef = ele} class={styles.TextArea} placeholder="Paste your JSON here" spellcheck={false}></textarea>
                <textarea ref={ele => codeOutputRef = ele} class={styles.TextArea} readonly placeholder="Generated Code"></textarea>
            </div>
        </div>
    </>;
}

export default JsonCodeGen;
