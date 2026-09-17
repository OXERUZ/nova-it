"use client";

import {useEffect} from "react";

export default function NovaMotion(){
  useEffect(()=>{
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".nova-reveal,.nova-stagger,.nova-text-reveal"
      )
    );

    if(!elements.length) return;

    const observer = new IntersectionObserver(
      entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          element.classList.add("is-visible");

          observer.unobserve(element);
        });
      },
      {
        threshold:0.12,
        rootMargin:"0px 0px -7% 0px"
      }
    );

    elements.forEach(element=>observer.observe(element));

    return ()=>observer.disconnect();
  },[]);

  return null;
}
