import { Github, Linkedin, Instagram, Heart } from "lucide-react";
import logoImage from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center gap-4">
          {/* Logo/Name */}
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Responze Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-white/80 text-sm">
              Desenvolvido por <span className="font-bold text-white">RTECH</span>
            </span>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/anderson-reinaldo"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
              title="GitHub"
            >
              <Github className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              <span className="text-xs text-white/70 group-hover:text-white transition-colors hidden sm:inline">
                GitHub
              </span>
            </a>
            
            <a
              href="http://www.linkedin.com/in/dev-anderson-reinaldo"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4 text-white/70 group-hover:text-blue-400 transition-colors" />
              <span className="text-xs text-white/70 group-hover:text-white transition-colors hidden sm:inline">
                LinkedIn
              </span>
            </a>
            
            <a
              href="https://www.instagram.com/dev.reinaldo/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
              title="Instagram"
            >
              <Instagram className="w-4 h-4 text-white/70 group-hover:text-pink-400 transition-colors" />
              <span className="text-xs text-white/70 group-hover:text-white transition-colors hidden sm:inline">
                Instagram
              </span>
            </a>
          </div>
          
          {/* Copyright */}
          <div className="text-xs text-white/50">
            © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  );
};
