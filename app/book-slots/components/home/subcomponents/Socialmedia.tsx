import React from "react";
import Image from "next/image";
import { FaYoutube, FaXTwitter, FaLinkedinIn } from "react-icons/fa6";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import Link from "next/link";


export default function Socialmedia() {
  return (
    <div className="flex items-center">
      <Link href="https://www.youtube.com/channel/UCJ7p-BC4daxVy7IpRvPQHww" className="inline-block mx-2 transition ease-in-out delay-150 hover:-translate-y-1">
        <FaYoutube size={24} color="#354E3B" />
      </Link>
      <Link href="https://x.com/GoNoKasa/" className="inline-block mx-2 transition ease-in-out delay-150 hover:-translate-y-1">
        <FaXTwitter size={24} color="#354E3B" />
      </Link>
      <Link href="https://www.instagram.com/saynokasa/" className="inline-block mx-2 transition ease-in-out delay-150 hover:-translate-y-1">
        <FaInstagram size={24} color="#354E3B" />
      </Link>
      <Link href="https://www.linkedin.com/company/nokasa/" className="inline-block mx-2 transition ease-in-out delay-150 hover:-translate-y-1">
        <FaLinkedinIn size={24} color="#354E3B" />
      </Link>
    </div>
  );
}
