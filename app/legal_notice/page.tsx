"use client";
import { useState, useEffect } from 'react';

const LegalNotice = () => {
    const [showContent, setShowContent] = useState(false);
    
    useEffect(() => {
        // Delay showing content to avoid server-side rendering
        const timer = setTimeout(() => setShowContent(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Obfuscated data
    const obfuscatedData = {
        name: btoa("Lucas Mair"),
        street: btoa("Fritz-Meyer-Weg 22"),
        city: btoa("Munich"),
        country: btoa("Germany"),
        email: btoa("lucas.mair@provigen.ai")
    };

    if (!showContent) {
        return (
            <div className="container">
                <div className="py-20 items-center"/>
                <div className="text-center mb-12 text-3xl font-bold !leading-relaxed text-black">Legal Disclosure</div>
                <div className="text-center mb-12">Loading...</div>
            </div>
        );
    }

    return (
        <>
        <div className="container">
            <div className="py-20 items-center"/>
            <div className="text-center mb-12 text-3xl font-bold !leading-relaxed text-black">Legal Disclosure</div>
            <div className="text-center mb-12">
                <div>Service Provider:</div>
                <div style={{direction: 'ltr'}}>{atob(obfuscatedData.name)}</div>
                <div className="select-none" data-content={atob(obfuscatedData.street)}>{atob(obfuscatedData.street)}</div>
                <div>{atob(obfuscatedData.city)}</div>
                <div>{atob(obfuscatedData.country)}</div>
                <div>
                    <span>Email: </span>
                    <span className="font-mono tracking-wider">
                        {atob(obfuscatedData.email).replace('@', '[at]').replace('.', '[dot]')}
                    </span>
                </div>
            </div>
        </div>
        </>
    );
};
  
  export default LegalNotice;
  