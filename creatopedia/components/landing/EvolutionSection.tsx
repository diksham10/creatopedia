'use client'

import React from 'react'

export default function EvolutionSection() {
  return (
    <section id="about" className="py-36 px-6 bg-transparent relative overflow-hidden group select-none">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse 100% 70% at 50% -5%, rgba(28,55,170,0.45) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 50% at 102% 105%, rgba(155,15,50,0.40) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      <div className="max-w-4xl mx-auto text-center space-y-4 mb-24 relative z-10">
        <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
          Evolution of the Creator Economy
        </h2>
        <p className="text-md font-light text-white/55 font-sans max-w-md mx-auto leading-relaxed">
          From fragmented, scattered prompt engineering workflows to direct, unified, high-impact digital storefronts.
        </p>
      </div>

      <div className="max-w-4xl mx-auto relative space-y-24 z-10">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-white/10 w-[1px] -z-10" />

        {[
          {
            chapter: 'Chapter I',
            title: 'Scattered World',
            desc: 'Creators share their work in many places and struggle to grow or earn.',
            align: 'right',
            number: '1'
          },
          {
            chapter: 'Chapter II',
            title: 'Easy Discovery',
            desc: 'Creatopedia brings all types of content into one place so people can find them easily.',
            align: 'left',
            number: '2'
          },
          {
            chapter: 'Chapter III',
            title: 'Creator Control',
            desc: 'Creators own their work, manage their store, keep their audience, and earn easily.',
            align: 'right',
            number: '3'
          }
        ].map((item, idx) => (
          <div key={idx} className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full relative ${item.align === 'left' ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1 hidden md:block" />
            <div className="w-10 h-10 rounded-full border border-[#ff1f4b]/40 bg-black flex items-center justify-center flex-shrink-0 z-20 md:absolute md:left-1/2 md:-translate-x-1/2">
              <span className="w-2 h-2 rounded-full bg-[#ff1f4b] animate-pulse"></span>
            </div>
            <div className={`flex-1 bg-[#111520]/70 backdrop-blur-sm p-8 border border-white/10 rounded-2xl space-y-3 hover:scale-[1.02] transition-all duration-500 text-left w-full hover:border-[#ff1f4b]/30 relative overflow-hidden select-none ${item.align === 'right' ? 'md:ml-12' : 'md:mr-12'}`}>
              <span className="font-mono text-[10px] text-[#ff1f4b] uppercase tracking-wider font-bold mb-3 block">{item.chapter}</span>
              <h3 className="text-xl font-black text-white leading-tight pr-12">{item.title}</h3>
              <p className="text-md font-sans text-white/55 leading-relaxed font-light">{item.desc}</p>
              <span className="absolute top-2 right-4 text-[100px] leading-none font-black text-white/5 font-sans pointer-events-none">
                {item.number}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
