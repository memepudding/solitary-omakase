import {speechSentences} from '@/lib/speech';
export default function SpeechText({text}:{text:string}){
 return <>{speechSentences(text).map((sentence,i)=><span className="speech-sentence" key={i}>{sentence}</span>)}</>;
}
