import React from 'react';
import NavBar from '../components/home/NavBar';
import Footer from '../components/common/Footer';

export default function Page() {
  return (
    <>
      <NavBar />
      <div className="m-8 mx-auto h-[120vh]">
        <iframe 
          src="/assets/website/privacy.html"
          className="w-full h-full overflow-hidden block max-w-[1000px] p-8 m-auto"
          id="tosIframe"
        />
      </div>
      <Footer />
    </>
  );
}
