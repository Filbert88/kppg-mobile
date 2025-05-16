import { useState } from "react";
import ImageUploadScreen from "./image-upload-screen";
import HoleInfoScreen from "./hole-info-screen";
import DepthMeasurementScreen from "./depth-measurement-screen";
import AverageScreen from "./average-screen";
import SummaryScreen from "./summary-screen";
import ActionScreenDA from "./action-da";
import DatePriority from "../date-priority";
import { fetchNextPriority } from "@/lib/function";
import { apiUrl } from "@/lib/function";

const initialEmptyForm = {
  numberOfHoles: 0,
  location: "",
  date: "",
  priority: "",
  image: null,
  depths: [],
  average: "",
  id: null,
};

export default function DepthAverageForm({
  setActiveScreen,
}: {
  setActiveScreen: React.Dispatch<
    React.SetStateAction<"home" | "fragmentation" | "depthAverage">
  >;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(initialEmptyForm);
  const [isEdit, setIsEdit] = useState(false);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateNumberOfHoles = (value: string) => {
    const numHoles = parseInt(value) || 0;
    setFormData((prev: any) => ({
      ...prev,
      numberOfHoles: numHoles,
      depths: Array(numHoles).fill(""),
    }));
  };

  const updateDepth = (index: number, value: string) => {
    setFormData((prev: any) => {
      const newDepths = [...prev.depths];
      newDepths[index] = value;
      return { ...prev, depths: newDepths };
    });
  };

  const handleNext = async () => {
    if (currentStep === 4) {
      const depths = formData.depths.filter((d: string) => d.trim() !== "");
      if (depths.length > 0) {
        const sum = depths.reduce(
          (acc: number, curr: string) => acc + (Number.parseFloat(curr) || 0),
          0
        );
        const avg = sum / depths.length;
        updateFormData("average", `${avg.toFixed(1)} m`);
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (isEdit && currentStep !== 6) return;

    if (currentStep === 0) {
      setActiveScreen("home");
    } else if (currentStep === 6) {
      setCurrentStep(0);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCancelEdit = () => {
    setIsEdit(false);
    setFormData(initialEmptyForm);
    setCurrentStep(6);
  };

  const handleSave = async () => {
    // common fields for both create & update
    const base = {
      jumlahLubang: formData.numberOfHoles.toString(),
      lokasi: formData.location,
      tanggal: formData.date,
      prioritas: Number(formData.priority),
      kedalaman: JSON.stringify(
        formData.depths.reduce((acc: Record<string, string>, v: any, i: any) => {
          acc[`kedalaman${i + 1}`] = v;
          return acc;
        }, {})
      ),
      average: formData.average.replace(' cm', '').replace(' m', ''),
      imageUri: formData.image,
      synced: 1,
    };

    try {
      let res: Response;

      if (isEdit && formData.id) {
        // —— UPDATE existing record ——
        // PUT /api/DepthAverage/{id} expects a single DepthAverage object in the body
        const updatePayload = { id: formData.id, ...base };

        res = await fetch(`${apiUrl}/DepthAverage/${formData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(updatePayload),
        });

        if (!res.ok) {
          throw new Error(`Update failed (${res.status})`);
        }
      } else {
        // —— CREATE new record ——
        // POST /api/DepthAverage expects a JSON array at the root
        const createItem = base; // no `id`
        const createBody = [createItem]; //<-- **just an array** of items

        res = await fetch(`${apiUrl}/DepthAverage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(createBody), //<-- **no wrapper**!
        });

        if (res.status === 409) {
          // handle priority conflict exactly as before…
          const { existingPriorities } = await res.json();
          const sorted = existingPriorities.sort(
            (a: number, b: number) => a - b
          );
          let newPriority = 1;
          for (const p of sorted) {
            if (p === newPriority) newPriority++;
            else if (p > newPriority) break;
          }

          createItem.prioritas = newPriority;
          // retry with new priority
          res = await fetch(`${apiUrl}/DepthAverage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify([createItem]), //<-- still just an array
          });
          if (!res.ok) throw new Error("Retry failed");
          updateFormData("priority", newPriority.toString());
        } else if (!res.ok) {
          throw new Error(`Create failed (${res.status})`);
        }
      }

      // on success…
      setActiveScreen("home");
    } catch (err) {
      console.error("Save error:", err);
      alert("Gagal menyimpan data. Silakan coba lagi.");
    }
  };

  const handleEditFromSummary = (item: any) => {
    const { id, lokasi, tanggal, prioritas, kedalaman, average, imageUri } =
      item;
    const depthsArr = Object.entries(kedalaman)
      .sort(
        ([a], [b]) =>
          parseInt(a.replace("kedalaman", "")) -
          parseInt(b.replace("kedalaman", ""))
      )
      .map(([, val]) => val);
    console.log("id", id);
    setFormData({
      id: id,
      location: lokasi,
      date: tanggal,
      priority: prioritas.toString(),
      numberOfHoles: depthsArr.length,
      depths: depthsArr,
      average: `${average}`,
      image: imageUri,
    });

    setIsEdit(true);
    setCurrentStep(2);
  };

  const renderStep = () => {
    const cancelButton = isEdit && (
      <button
        onClick={handleCancelEdit}
        className="absolute top-0 right-0 bg-red-500 text-white px-4 py-2 rounded-lg"
      >
        Cancel Edit
      </button>
    );

    switch (currentStep) {
      case 0:
        return (
          <ActionScreenDA
            onTambahClick={() => setCurrentStep(1)}
            onRiwayatClick={() => setCurrentStep(6)}
          />
        );
      case 1:
        return (
          <>
            {cancelButton}
            <DatePriority
              date={formData.date}
              priority={formData.priority}
              onDateChange={async (value) => {
                updateFormData("date", value);
                const next = await fetchNextPriority(value, "depthAverage");
                if (next !== null) updateFormData("priority", next.toString());
              }}
              onPriorityChange={(value) => updateFormData("priority", value)}
              onNext={handleNext}
              formType="depthAverage"
              label="Tanggal Pengukuran"
            />
          </>
        );
      case 2:
        return (
          <>
            {cancelButton}
            <ImageUploadScreen
              image={formData.image}
              onImageSelect={(_, imageUrl, depths) => {
                updateFormData("image", imageUrl);
                updateFormData("numberOfHoles", depths.length);
                updateFormData("depths", depths);
              }}
              onNext={handleNext}
              isEdit={isEdit}
            />
          </>
        );
      case 3:
        return (
          <>
            {cancelButton}
            <HoleInfoScreen
              numberOfHoles={formData.numberOfHoles.toString()}
              location={formData.location}
              date={formData.date}
              onUpdateNumberOfHoles={(value) => updateNumberOfHoles(value)}
              onUpdateLocation={(value) => updateFormData("location", value)}
              onNext={handleNext}
            />
          </>
        );
      case 4:
        return (
          <>
            {cancelButton}
            <DepthMeasurementScreen
              depths={formData.depths}
              onUpdateDepth={updateDepth}
              onNext={handleNext}
            />
          </>
        );
      case 5:
        return <AverageScreen average={formData.average} onSave={handleSave} />;
      case 6:
        return <SummaryScreen onEdit={handleEditFromSummary} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl relative h-full">
      <button
        onClick={handleBack}
        className="absolute left-0 top-0 bg-green-800 text-white px-4 py-2 font-medium rounded-lg"
      >
        Back
      </button>
      {renderStep()}
    </div>
  );
}
