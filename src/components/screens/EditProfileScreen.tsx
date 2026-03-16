import React, { useState } from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Badge } from "../findcollab/Badge";

interface Props {
  onBack: () => void;
}

const EditProfileScreen: React.FC<Props> = ({ onBack }) => {
  const [name, setName] = useState("Dilraj Singh");
  const [bio, setBio] = useState("India's Biggest Science & Experiment Creator");
  const [location, setLocation] = useState("Chennai");
  const [instagram, setInstagram] = useState("@dilrajsingh");
  const [youtube, setYoutube] = useState("@dilrajsingh");
  const [gmail, setGmail] = useState("");
  const [categories, setCategories] = useState(["Food", "Fitness", "Science & Tech", "Movies"]);
  const [newCat, setNewCat] = useState("");

  const addCategory = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
      setNewCat("");
    }
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="Edit Profile" onBack={onBack} />
      <div className="p-4 flex flex-col gap-3.5">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-[22px] bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-[32px] font-black">D</span>
          </div>
        </div>

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-3">Basic Info</p>
          <div className="flex flex-col gap-3">
            <AppInput label="Full Name" value={name} onChange={setName} placeholder="Your name" />
            <AppInput label="Bio" value={bio} onChange={setBio} placeholder="Short bio" multiline />
            <AppInput label="Location" value={location} onChange={setLocation} placeholder="City" />
          </div>
        </Card>

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-3">Social Handles</p>
          <div className="flex flex-col gap-3">
            <AppInput label="Instagram" value={instagram} onChange={setInstagram} placeholder="@username" />
            <AppInput label="YouTube" value={youtube} onChange={setYoutube} placeholder="@channel" />
          </div>
        </Card>

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-3">Categories</p>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {categories.map((c) => (
              <div key={c} onClick={() => removeCategory(c)} className="cursor-pointer">
                <Badge color="pink" sm>{c} ✕</Badge>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <AppInput value={newCat} onChange={setNewCat} placeholder="Add category" />
            </div>
            <AppButton variant="outline" icon="plus" onClick={addCategory} className="!py-2.5 !px-3.5">Add</AppButton>
          </div>
        </Card>

        <AppButton full icon="check" onClick={onBack}>Save Changes</AppButton>
      </div>
    </div>
  );
};

export default EditProfileScreen;
