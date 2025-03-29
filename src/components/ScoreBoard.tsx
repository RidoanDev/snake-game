
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trophy, Zap } from "lucide-react";

interface ScoreBoardProps {
  score: number;
  highScore: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, highScore }) => {
  return (
    <Card className="w-full max-w-xs p-4 mb-4 bg-secondary/50 backdrop-blur-sm">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <div className="text-sm text-muted-foreground">Current Score</div>
          <div className="text-2xl font-bold text-white flex items-center">
            <Zap className="h-5 w-5 mr-1 text-primary animate-pulse" />
            {score}
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-sm text-muted-foreground">High Score</div>
          <div className="text-2xl font-bold text-white flex items-center">
            <Trophy className="h-5 w-5 mr-1 text-yellow-400" />
            {highScore}
          </div>
        </div>
      </div>
      
      {score > 0 && score === highScore && (
        <Badge variant="outline" className="mt-2 mx-auto border-yellow-400 text-yellow-400 animate-bounce">
          New Record!
        </Badge>
      )}
    </Card>
  );
};

export default ScoreBoard;
