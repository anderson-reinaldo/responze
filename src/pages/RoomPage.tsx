import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RoomParticipant from '@/components/RoomParticipant';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  if (!roomId) {
    navigate('/');
    return null;
  }

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <RoomParticipant
      roomId={roomId}
      onGoHome={handleGoHome}
    />
  );
}
