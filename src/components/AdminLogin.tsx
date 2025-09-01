import { useState } from "react";
import { Lock } from "lucide-react";
import { QuizButton } from "@/components/ui/quiz-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

const ADMIN_PASSWORD = "1545";

export const AdminLogin = ({ onLogin, onBack }: AdminLoginProps) => {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkPassword = (passwordToCheck: string) => {
    if (passwordToCheck === ADMIN_PASSWORD) {
      toast.success("Acesso autorizado!");
      onLogin();
      return true;
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsBlocked(true);
        toast.error("Muitas tentativas incorretas. Tente novamente em 30 segundos.");
        setTimeout(() => {
          setIsBlocked(false);
          setAttempts(0);
        }, 30000);
      } else {
        toast.error(`Senha incorreta! ${3 - newAttempts} tentativas restantes.`);
      }
      
      setDigits(["", "", "", ""]);
      // Foca no primeiro campo após erro
      setTimeout(() => {
        const firstInput = document.getElementById("digit-0");
        if (firstInput) firstInput.focus();
      }, 100);
      return false;
    }
  };

  const handleLogin = () => {
    const password = digits.join("");
    checkPassword(password);
  };

  const handleDigitChange = (index: number, value: string) => {
    // Apenas números e um único dígito
    const numericValue = value.replace(/\D/g, "").slice(0, 1);
    
    const newDigits = [...digits];
    newDigits[index] = numericValue;
    setDigits(newDigits);

    // Move para o próximo campo automaticamente
    if (numericValue && index < 3) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Se todos os dígitos foram preenchidos, faz login automaticamente
    if (numericValue && index === 3) {
      const password = newDigits.join("");
      if (password.length === 4) {
        setTimeout(() => {
          checkPassword(password);
        }, 200);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Se o campo atual está vazio e pressiona backspace, vai para o anterior
        const prevInput = document.getElementById(`digit-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    } else if (e.key === "Enter") {
      const password = digits.join("");
      if (password.length === 4) {
        checkPassword(password);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    
    if (pastedText.length === 4) {
      setDigits(pastedText.split(""));
      setTimeout(() => checkPassword(pastedText), 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-red-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border-2 border-accent/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-accent">
            Painel Administrativo
          </CardTitle>
          <p className="text-sm text-foreground/70">
            Digite a senha de 4 dígitos para acessar
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              Senha de Acesso (4 dígitos)
            </label>
            
            {/* 4 caixas separadas para os dígitos */}
            <div className="flex justify-center gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  id={`digit-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isBlocked}
                  className="w-16 h-16 text-center text-2xl font-bold bg-background border-2 border-accent/30 rounded-lg focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  maxLength={1}
                  autoComplete="off"
                />
              ))}
            </div>
            
            <div className="text-center text-xs text-foreground/50">
              Digite os 4 dígitos da senha
            </div>
            
            {attempts > 0 && !isBlocked && (
              <p className="text-xs text-red-500 text-center">
                {3 - attempts} tentativa(s) restante(s)
              </p>
            )}
            
            {isBlocked && (
              <p className="text-xs text-red-500 text-center">
                Acesso bloqueado temporariamente
              </p>
            )}
          </div>

          <div className="space-y-3">
            <QuizButton
              onClick={handleLogin}
              disabled={isBlocked || digits.join("").length !== 4}
              className="w-full"
              size="lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              Acessar Painel
            </QuizButton>
            
            <QuizButton
              onClick={onBack}
              variant="secondary"
              className="w-full"
            >
              Voltar
            </QuizButton>
          </div>

          <div className="text-center">
            <p className="text-xs text-foreground/50">
              Sistema seguro de autenticação
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
