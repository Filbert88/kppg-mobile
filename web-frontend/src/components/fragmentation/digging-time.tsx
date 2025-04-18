"use client";

import { useState, useRef, useEffect } from "react";
import {
  Clock,
  Plus,
  Video,
  X,
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  Trash2,
} from "lucide-react";

interface DiggingTimePageProps {
  onSaveDiggingData: (diggingTime: string, videoUrl: string) => void;
  onBack: () => void;
}

export default function DiggingTimePage({
  onSaveDiggingData,
  onBack,
}: DiggingTimePageProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [time, setTime] = useState("00:00:00");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [savedTime, setSavedTime] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    setTime(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    );
  }, [elapsedTime]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const startStopwatch = () => setIsRunning(true);
  const stopStopwatch = () => setIsRunning(false);
  const resetStopwatch = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };
  const resumeStopwatch = () => setIsRunning(true);

  const saveStopwatchTime = () => {
    setSavedTime(time);
    setIsStopwatchOpen(false);
  };

  const saveManualTime = () => {
    const h = hours.padStart(2, "0") || "00";
    const m = minutes.padStart(2, "0") || "00";
    const s = seconds.padStart(2, "0") || "00";
    setSavedTime(`${h}:${m}:${s}`);
    setIsManualInputOpen(false);
  };

  const handleDeleteSavedTime = () => {
    setSavedTime(null);
  };

  const handleSave = async () => {
    try {
      let videoUrl = "";

      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);

        const uploadRes = await fetch(
          "http://localhost:5180/api/Upload/upload-video",
          {
            method: "POST",
            body: formData,
          }
        );
console.log(uploadRes)
        if (!uploadRes.ok) throw new Error("Video upload failed");

        const data = await uploadRes.json();
        videoUrl = data.url;
      }

      if (!savedTime) {
        alert("Please set a digging time first.");
        return;
      }

      onSaveDiggingData(savedTime, videoUrl); 
      onBack(); // return to SummaryScreen
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full mt-4">
      <div className="flex flex-col p-6 mt-4 w-full">
        {/* Video Upload */}
        <div
          className="border-2 border-gray-300 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-white mb-6 h-48 relative"
          onClick={() => fileInputRef.current?.click()}
        >
          {videoPreview ? (
            <>
              <video
                src={videoPreview}
                className="w-full h-full object-cover rounded"
                controls
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveVideo();
                }}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center mb-2">
                <Video className="text-gray-400 mr-2" size={24} />
                <Plus className="text-gray-400" size={20} />
              </div>
              <div className="text-gray-400 text-center">Upload video...</div>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/*"
            onChange={handleVideoUpload}
          />
        </div>

        {/* Digging Time */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Digging Time</h2>

          {savedTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="text-green-500 mr-3" size={20} />
                <div>
                  <p className="text-green-800 font-medium">Time recorded</p>
                  <p className="text-green-700 text-xl font-bold">
                    {savedTime}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeleteSavedTime}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}

          <button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg mb-2 flex items-center justify-center transition-colors"
            onClick={() => setIsStopwatchOpen(true)}
          >
            <Clock className="mr-2" size={18} />
            Mulai Stopwatch
          </button>

          <div className="text-center text-gray-500 my-2">atau</div>

          <button
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 flex items-center justify-center transition-colors"
            onClick={() => setIsManualInputOpen(true)}
          >
            <Plus className="mr-2" size={18} />
            Tambah Manual
          </button>
        </div>

        {/* Save Button */}
        <div className="mt-auto flex justify-center">
          <button
            className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-md transition-colors"
            onClick={handleSave}
            disabled={!savedTime}
          >
            Simpan
          </button>
        </div>
      </div>

      {/* Stopwatch Modal */}
      {isStopwatchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Stopwatch</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsStopwatchOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-mono font-bold tracking-wider bg-gray-100 py-6 rounded-lg">
                  {time}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                  onClick={resetStopwatch}
                >
                  <RotateCcw className="mr-2" size={16} />
                  Reset
                </button>

                {!isRunning ? (
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                    onClick={startStopwatch}
                  >
                    <Play className="mr-2" size={16} />
                    Start
                  </button>
                ) : (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                    onClick={stopStopwatch}
                  >
                    <Square className="mr-2" size={16} />
                    Stop
                  </button>
                )}

                {!isRunning && elapsedTime > 0 && (
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors col-span-2"
                    onClick={resumeStopwatch}
                  >
                    <Play className="mr-2" size={16} />
                    Resume
                  </button>
                )}
              </div>

              <button
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                onClick={saveStopwatchTime}
              >
                <Plus className="mr-2" size={16} />
                Simpan Waktu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Input Modal */}
      {isManualInputOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Input waktu</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsManualInputOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-center items-center space-x-2 mb-8">
                {[
                  { value: hours, setValue: setHours, label: "Hours" },
                  { value: minutes, setValue: setMinutes, label: "Minutes" },
                  { value: seconds, setValue: setSeconds, label: "Seconds" },
                ].map(({ value, setValue, label }, i) => (
                  <div key={i} className="time-input-container">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="00"
                      value={value}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, ""); // only digits
                        if (raw.length <= 2) {
                          setValue(raw);
                        }
                      }}
                      onBlur={() => {
                        // Format on blur
                        if (value.length === 0) {
                          setValue("00");
                        } else if (value.length === 1) {
                          setValue("0" + value);
                        } else {
                          setValue(value);
                        }
                      }}
                      onFocus={(e) => e.target.select()} // select all text on click/focus
                      className="w-16 h-16 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                    />

                    <span className="text-xs text-gray-500 mt-1 block text-center">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                onClick={saveManualTime}
              >
                <Plus className="mr-2" size={16} />
                Simpan Waktu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
