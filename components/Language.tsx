'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import type {Locale} from '@/lib/locale';
const Context=createContext<{locale:Locale;setLocale:(l:Locale)=>void}>({locale:'ko',setLocale:()=>{}});
export function LanguageProvider({initial,children}:{initial:Locale;children:React.ReactNode}){const [locale,update]=useState(initial);useEffect(()=>{document.documentElement.lang=locale;document.title=locale==='ko'?'고독한 오마카세 — Omakase for One':'Solitary Omakase — Omakase for One';},[locale]);function setLocale(l:Locale){update(l);document.cookie=`teepu-lang=${l}; Path=/; Max-Age=86400; SameSite=Lax`;}return <Context.Provider value={{locale,setLocale}}>{children}</Context.Provider>;}
export function useLanguage(){const state=useContext(Context);return {...state,t:(ko:string,en:string)=>state.locale==='ko'?ko:en};}
