// ===== 3. TOOLS (THE HANDS) — 35 TOOLS =====
// NOTE: expects your existing speak(text) function to be defined elsewhere.

// ---------- helpers ----------
let swStart = null; // stopwatch state
const toMs = u => /^(hours?|hrs?|h)/.test(u) ? 3600000 : /^(seconds?|secs?|s)/.test(u) ? 1000 : 60000;
const loadList = k => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch(e){ return []; } };
const saveList = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };

async function handleTools(text){
  const t = text.toLowerCase();
  const has = (...w) => w.some(x => t.includes(x));

  // 1. Time
  if(/\btime\b/.test(t)||t.includes('టైమ్')||t.includes('సమయం'))
    return 'The time is '+new Date().toLocaleTimeString()+', Boss.';

  // 2. Weather
  if(t.includes('weather')||t.includes('వాతావరణం')){
    return await new Promise(res=>{
      navigator.geolocation.getCurrentPosition(async p=>{
        try{
          const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current_weather=true`);
          const d=await r.json();
          res(`It is ${d.current_weather.temperature} degrees Celsius now, Boss.`);
        }catch(e){ res('Weather service error, Boss.'); }
      }, ()=> res('I need location permission for weather, Boss.'));
    });
  }

  // 3. Timer
  const m=t.match(/(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i);
  if((t.includes('timer')||t.includes('టైమర్'))&&m){
    const amount=parseInt(m[1]); const unit=m[2].toLowerCase();
    const factor=/^(hours?|hrs?|h)/.test(unit)?3600000:/^(seconds?|secs?|s)/.test(unit)?1000:60000;
    const duration=amount*factor;
    setTimeout(()=>speak(`టైమర్ పూర్తైంది! ${amount} ${unit} అయ్యాయి.`),duration);
    return `Timer set for ${amount} ${unit}.`;
  }

  // 4. Translate
  if(t.includes('translate')){
    const q=text.replace(/translate (this )?/i,'').trim()||'hello';
    try{
      const r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair=en|te');
      const d=await r.json(); return 'In Telugu: '+d.responseData.translatedText;
    }catch(e){ return 'Translate error, Boss.'; }
  }

  // 5. YouTube Play
  if(t.includes('play ')||t.includes('youtube ')){
    const q=text.replace(/play |youtube (search )?/i,'').trim();
    if(q){ window.open('https://www.youtube.com/results?search_query='+encodeURIComponent(q)); return 'Searching YouTube for '+q+', Boss.'; }
  }

  // 6. Date / Day
  if(has('date','what day','తేదీ','తేది')){
    return 'Today is '+new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+', Boss.';
  }

  // 7. Calculator
  {
    const trigger = has('calculate','calc','solve','what is','what\'s','plus','minus','times','divided') || /^[\d\s+\-*/().x%^]+$/.test(t);
    if(trigger){
      const e = t
        .replace(/calculate|calc|solve|what is|what's/g,'')
        .replace(/\bplus\b|\badd\b/g,'+')
        .replace(/\bminus\b|\bsubtract\b/g,'-')
        .replace(/multiplied by|\btimes\b|\bmultiply\b|\binto\b|\bx\b/g,'*')
        .replace(/divided by|\bdivide\b/g,'/')
        .replace(/\^/g,'**')
        .replace(/\?/g,'')
        .trim();
      if(/^[\d+\-*/().%\s]+$/.test(e) && /\d/.test(e) && /[+\-*/%]/.test(e)){
        try{
          const v = Function('"use strict";return ('+e+')')();
          if(isFinite(v)) return `The answer is ${Math.round(v*1e6)/1e6}, Boss.`;
        }catch(err){}
      }
    }
  }

  // 8. Google Search
  if(t.startsWith('search ')||has('google ')){
    const q=text.replace(/google (search )?|search (for |on google )?/i,'').trim();
    if(q){ window.open('https://www.google.com/search?q='+encodeURIComponent(q)); return 'Searching Google for '+q+', Boss.'; }
  }

  // 9. Wikipedia
  if(has('wikipedia','who is','who was','tell me about')){
    const q=text.replace(/wikipedia|who is|who was|tell me about/ig,'').trim();
    if(q){
      try{
        const r=await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(q));
        const d=await r.json();
        if(d.extract) return d.extract.split('. ').slice(0,2).join('. ')+'.';
        return 'I could not find that on Wikipedia, Boss.';
      }catch(e){ return 'Wikipedia error, Boss.'; }
    }
  }

  // 10. WhatsApp message
  {
    const w=text.match(/whatsapp.*?(\+?\d{10,13})\s*(.*)/i);
    if(w){
      window.open('https://wa.me/'+w[1].replace('+','')+'?text='+encodeURIComponent(w[2]||''));
      return 'Opening WhatsApp, Boss.';
    }
  }

  // 11. Email compose
  {
    const em=text.match(/email\s+(?:to\s+)?([\w.+-]+@[\w.-]+)\s*(.*)/i);
    if(em){
      window.open('mailto:'+em[1]+'?body='+encodeURIComponent(em[2]||''));
      return 'Opening email to '+em[1]+', Boss.';
    }
  }

  // 12. Maps / Navigate
  if(has('navigate to','directions to','route to','map of','near me')){
    const q=text.replace(/navigate to|directions to|route to|map of/ig,'').trim();
    window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q));
    return 'Opening maps for '+q+', Boss.';
  }

  // 13. Open Website
  if(t.startsWith('open ')||t.includes('ఓపెన్')){
    const sites={youtube:'https://www.youtube.com',google:'https://www.google.com',gmail:'https://mail.google.com',
      whatsapp:'https://web.whatsapp.com',instagram:'https://www.instagram.com',facebook:'https://www.facebook.com',
      twitter:'https://x.com',x:'https://x.com',github:'https://github.com',maps:'https://maps.google.com',
      linkedin:'https://www.linkedin.com',netflix:'https://www.netflix.com',amazon:'https://www.amazon.in',
      flipkart:'https://www.flipkart.com',wikipedia:'https://www.wikipedia.org',chatgpt:'https://chat.openai.com'};
    const name=t.replace(/^open |ఓపెన్/g,'').trim();
    if(sites[name]){ window.open(sites[name]); return 'Opening '+name+', Boss.'; }
    if(/^[\w-]+\.[a-z.]{2,}/.test(name)){ window.open('https://'+name); return 'Opening '+name+', Boss.'; }
  }

  // 14. Battery
  if(has('battery','బ్యాటరీ')){
    try{
      const b=await navigator.getBattery();
      return `Battery is at ${Math.round(b.level*100)} percent${b.charging?' and charging':''}, Boss.`;
    }catch(e){ return 'Battery info is not supported on this device, Boss.'; }
  }

  // 15. Coin Flip
  if(has('coin','toss','flip a')){
    return 'It is '+(Math.random()<0.5?'Heads':'Tails')+', Boss.';
  }

  // 16. Dice Roll
  if(has('dice','roll a')){
    return 'You rolled a '+(Math.floor(Math.random()*6)+1)+', Boss.';
  }

  // 17. Random Number
  if(has('random number')){
    const r2=t.match(/between\s*(\d+)\s*(?:and|to)\s*(\d+)/);
    const lo=r2?parseInt(r2[1]):1, hi=r2?parseInt(r2[2]):100;
    return 'Your random number is '+(Math.floor(Math.random()*(hi-lo+1))+lo)+', Boss.';
  }

  // 18. Joke
  if(has('joke','జోక్')){
    try{
      const r=await fetch('https://official-joke-api.appspot.com/random_joke');
      const d=await r.json(); return d.setup+' ... '+d.punchline;
    }catch(e){ return 'Joke service error, Boss.'; }
  }

  // 19. Motivational Quote
  if(has('quote','motivate','motivation')){
    try{
      const r=await fetch('https://dummyjson.com/quotes/random');
      const d=await r.json(); return d.quote+' — '+d.author;
    }catch(e){ return 'Quote service error, Boss.'; }
  }

  // 20. Unit Converter (km/mi, kg/lb, C/F)
  {
    const um=t.match(/(-?\d+(?:\.\d+)?)\s*(km|kilometers?|miles?|mi|kg|kilograms?|lbs?|pounds?|celsius|fahrenheit)\s*(?:to|in|into)\s*(km|kilometers?|miles?|mi|kg|kilograms?|lbs?|pounds?|celsius|fahrenheit)/);
    if(um){
      const norm=u=>/^(km|kilo(meter)?s?$)/.test(u)&&!/^kilogram/.test(u)?'km':/^mi/.test(u)?'mi':/^(kg|kilogram)/.test(u)?'kg':/^(lb|pound)/.test(u)?'lb':/^c/.test(u)?'c':'f';
      const v=parseFloat(um[1]), a=norm(um[2]), b=norm(um[3]);
      const f={'km>mi':v*0.621371,'mi>km':v*1.609344,'kg>lb':v*2.20462,'lb>kg':v*0.453592,'c>f':v*9/5+32,'f>c':(v-32)*5/9};
      const out=f[a+'>'+b];
      if(out!==undefined) return `${v} ${um[2]} is ${Math.round(out*100)/100} ${um[3]}, Boss.`;
    }
  }

  // 21. Currency Converter
  {
    const cm=t.match(/(\d+(?:\.\d+)?)\s*([a-z]{3})\s*(?:to|in)\s*([a-z]{3})/);
    if(cm){
      try{
        const r=await fetch('https://open.er-api.com/v6/latest/USD');
        const d=await r.json();
        const from=cm[2].toUpperCase(), to=cm[3].toUpperCase();
        if(d.rates[from]&&d.rates[to]){
          const out=parseFloat(cm[1])/d.rates[from]*d.rates[to];
          return `${cm[1]} ${from} is ${out.toFixed(2)} ${to}, Boss.`;
        }
      }catch(e){ return 'Currency service error, Boss.'; }
    }
  }

  // 22. Stopwatch
  if(has('stopwatch')){
    if(has('start')){ swStart=Date.now(); return 'Stopwatch started, Boss.'; }
    if(has('stop','end')){
      if(!swStart) return 'Stopwatch is not running, Boss.';
      const s=Math.round((Date.now()-swStart)/1000); swStart=null;
      return `Stopwatch stopped. ${Math.floor(s/60)} minutes ${s%60} seconds, Boss.`;
    }
  }

  // 23. Reminder
  {
    const rm=text.match(/remind me (?:to )?(.+?) in (\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i);
    if(rm){
      const task=rm[1], amt=parseInt(rm[2]), unit=rm[3].toLowerCase();
      setTimeout(()=>speak(`Reminder, Boss: ${task}`), amt*toMs(unit));
      return `Okay, I will remind you to ${task} in ${amt} ${unit}.`;
    }
  }

  // 24. Clear Notes
  if(has('clear notes','delete notes')){
    saveList('notes',[]); return 'All notes cleared, Boss.';
  }

  // 25. Read Notes
  if(has('read notes','my notes','show notes')){
    const n=loadList('notes');
    return n.length ? 'Your notes: '+n.map((x,i)=>(i+1)+'. '+x).join('. ') : 'You have no notes, Boss.';
  }

  // 26. Save Note
  if(t.startsWith('note ')||has('save note','remember that')){
    const n=text.replace(/^note |save note|remember that/ig,'').trim();
    if(n){ const l=loadList('notes'); l.push(n); saveList('notes',l); return 'Noted: '+n; }
  }

  // 27. Todo — Show
  if(has('my tasks','show tasks','todo list','my todos','show todos')){
    const l=loadList('todos');
    return l.length ? 'Your tasks: '+l.map((x,i)=>(i+1)+'. '+x).join('. ') : 'No tasks, Boss. You are free!';
  }

  // 28. Todo — Add
  if(has('add task','add todo','todo add')){
    const task=text.replace(/add task|add todo|todo add/ig,'').trim();
    if(task){ const l=loadList('todos'); l.push(task); saveList('todos',l); return 'Task added: '+task; }
  }

  // 29. Dictionary
  if(has('define','meaning of','definition of')){
    const word=t.replace(/define|meaning of|definition of|what is the/g,'').trim().split(' ').pop();
    if(word){
      try{
        const r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word));
        const d=await r.json();
        return word+': '+d[0].meanings[0].definitions[0].definition;
      }catch(e){ return 'I could not find that word, Boss.'; }
    }
  }

  // 30. IP Address
  if(has('ip address','my ip')){
    try{
      const r=await fetch('https://api.ipify.org?format=json');
      const d=await r.json(); return 'Your IP address is '+d.ip+', Boss.';
    }catch(e){ return 'Could not get IP address, Boss.'; }
  }

  // 31. Device Info
  if(has('device info','system info')){
    return `Screen ${screen.width} by ${screen.height}, ${navigator.hardwareConcurrency||'unknown'} CPU cores, ${navigator.onLine?'online':'offline'}, Boss.`;
  }

  // 32. Fullscreen
  if(has('fullscreen','full screen')){
    try{
      if(has('exit','close')&&document.fullscreenElement){ await document.exitFullscreen(); return 'Exited fullscreen, Boss.'; }
      await document.documentElement.requestFullscreen(); return 'Fullscreen on, Boss.';
    }catch(e){ return 'Fullscreen not allowed, Boss.'; }
  }

  // 33. Dark / Light Mode Toggle
  if(has('dark mode','light mode','invert theme')){
    const root=document.documentElement;
    const on=root.style.filter==='';
    root.style.filter = on ? 'invert(1) hue-rotate(180deg)' : '';
    return 'Theme switched, Boss.';
  }

  // 34. Password Generator
  if(has('password')){
    const n=t.match(/(\d+)/); const len=Math.min(Math.max(n?parseInt(n[1]):12,6),64);
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    const arr=crypto.getRandomValues(new Uint32Array(len));
    const pw=Array.from(arr,x=>chars[x%chars.length]).join('');
    try{ await navigator.clipboard.writeText(pw); }catch(e){}
    return 'Your password is '+pw+' (copied to clipboard), Boss.';
  }

  // 35. Say / Repeat
  {
    const sm=text.match(/^(?:say|repeat|speak)\s+(.+)/i);
    if(sm) return sm[1];
  }

  return null; // Tool match కాకపోతే Gemini Brain కి వెళ్తుంది
}

