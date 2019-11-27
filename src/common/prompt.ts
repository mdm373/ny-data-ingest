import {createInterface} from 'readline';

export type Prompt = Readonly<{
    question: (query: string) => Promise<string>;
    close: () => void;
  }>

export const createPrompt = (): Prompt => {
  const readLine = createInterface({input: process.stdin, output: process.stdout});
  const question = (query: string): Promise<string> => {
    return new Promise<string>((accept) => readLine.question(query, accept));
  };
  const close = (): void => readLine.close();
  return {question, close};
};
