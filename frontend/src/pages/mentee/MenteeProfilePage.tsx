import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  GraduationCap,
  Target,
  Briefcase,
  Award,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';

export const MenteeProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'academic' | 'personal' | 'skills' | 'career' | 'privacy'>('personal');

  const [formData, setFormData] = useState({
    phone: '',
    section: '',
    hobbies: '',
    interests: '',
    strengths: '',
    areasForImprovement: '',
    skills: '',
    certifications: '',
    achievements: '',
    extracurricular: '',
    projects: '',
    careerGoals: '',
    specializationPreference: '',
    personalDevGoals: '',
    mentoringPreferences: '',
    privateNotes: '',
    shareWithMentor: true,
  });

  useEffect(() => {
    api.getMenteeProfile().then((data) => {
      setProfile(data);
      setFormData({
        phone: data.phone || '',
        section: data.section || 'A',
        hobbies: data.hobbies || '',
        interests: data.interests || '',
        strengths: data.strengths || '',
        areasForImprovement: data.areasForImprovement || '',
        skills: data.skills || '',
        certifications: data.certifications || '',
        achievements: data.achievements || '',
        extracurricular: data.extracurricular || '',
        projects: data.projects || '',
        careerGoals: data.careerGoals || '',
        specializationPreference: data.specializationPreference || '',
        personalDevGoals: data.personalDevGoals || '',
        mentoringPreferences: data.mentoringPreferences || '',
        privateNotes: data.privateNotes || '',
        shareWithMentor: data.shareWithMentor !== false,
      });
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateMenteeProfile(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Academic & Mentoring Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal development goals, career objectives, and review what is shared with faculty.
          </p>
        </div>
        <Button onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
          Save Changes
        </Button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-700 to-indigo-500 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {profile.fullName.charAt(0)}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{profile.fullName}</h3>
                <Badge variant="outline" size="sm" className="font-mono">{profile.usn}</Badge>
              </div>
              <p className="text-xs text-slate-500">
                {profile.department?.name} • Semester {profile.semester} • Section {formData.section || profile.section}
              </p>
              <p className="text-xs text-slate-400 font-mono">{profile.collegeEmail}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Mentor Sharing Status:</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-1 ${formData.shareWithMentor ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formData.shareWithMentor ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {formData.shareWithMentor ? 'Shared with Assigned Faculty' : 'Confidential (Student Private)'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'personal', label: 'Personal & Strengths', icon: User },
          { id: 'skills', label: 'Skills & Achievements', icon: Award },
          { id: 'career', label: 'Career Goals & Specialization', icon: Target },
          { id: 'academic', label: 'Academic Standing', icon: GraduationCap },
          { id: 'privacy', label: 'Privacy & Mentee Notes', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal & Strengths */}
      {activeTab === 'personal' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Personal Attributes & Self-Assessment</CardTitle>
              <p className="text-xs text-slate-500">Shared with your assigned mentor to personalize guidance.</p>
            </div>
            <Badge variant="success" size="sm">Shared with Mentor</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 91234 56789"
              />
              <Input
                label="Class Section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="A, B, or C"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Hobbies & Personal Interests
              </label>
              <textarea
                name="hobbies"
                rows={2}
                value={formData.hobbies}
                onChange={handleChange}
                placeholder="e.g. Competitive Programming, Chess, Photography, Technical Blogging..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Key Strengths
                </label>
                <textarea
                  name="strengths"
                  rows={3}
                  value={formData.strengths}
                  onChange={handleChange}
                  placeholder="e.g. Fast learner, algorithms, team collaboration, disciplined study..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Areas for Improvement
                </label>
                <textarea
                  name="areasForImprovement"
                  rows={3}
                  value={formData.areasForImprovement}
                  onChange={handleChange}
                  placeholder="e.g. Public speaking, time management during exam weeks, Operating Systems..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Skills & Achievements */}
      {activeTab === 'skills' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Skills, Projects & Certifications</CardTitle>
              <p className="text-xs text-slate-500">Showcase technical proficiencies and extracurricular activities.</p>
            </div>
            <Badge variant="success" size="sm">Shared with Mentor</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Technical Skills & Tools
              </label>
              <textarea
                name="skills"
                rows={2}
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. TypeScript, Python, React, PostgreSQL, Docker, Git..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Certifications Completed
              </label>
              <textarea
                name="certifications"
                rows={2}
                value={formData.certifications}
                onChange={handleChange}
                placeholder="e.g. AWS Certified Cloud Practitioner, NPTEL Algorithms Silver Medalist..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Notable Projects & Research
              </label>
              <textarea
                name="projects"
                rows={3}
                value={formData.projects}
                onChange={handleChange}
                placeholder="e.g. Campus Marketplace with Go backend, Real-time Collaborative Whiteboard..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Extracurricular Activities & Achievements
              </label>
              <textarea
                name="achievements"
                rows={2}
                value={formData.achievements}
                onChange={handleChange}
                placeholder="e.g. Hackathon 1st place, University debate team, IEEE student branch member..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Career Goals */}
      {activeTab === 'career' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Career Goals & Specialization</CardTitle>
              <p className="text-xs text-slate-500">Helps mentors recommend suitable electives, internships, and research papers.</p>
            </div>
            <Badge variant="success" size="sm">Shared with Mentor</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Target Career Role & Long-Term Vision
              </label>
              <textarea
                name="careerGoals"
                rows={2}
                value={formData.careerGoals}
                onChange={handleChange}
                placeholder="e.g. Cloud Solutions Architect or AI Research Specialist at a global tier-1 lab..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Preferred Area of Specialization
              </label>
              <textarea
                name="specializationPreference"
                rows={2}
                value={formData.specializationPreference}
                onChange={handleChange}
                placeholder="e.g. Distributed Systems, Cybersecurity, Data Engineering, Embedded Robotics..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Personal Development Objectives for Current Semester
              </label>
              <textarea
                name="personalDevGoals"
                rows={2}
                value={formData.personalDevGoals}
                onChange={handleChange}
                placeholder="e.g. Read 2 technical architecture books, solve 100 LeetCode problems, maintain 90% attendance..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Mentoring Session Preferences
              </label>
              <textarea
                name="mentoringPreferences"
                rows={2}
                value={formData.mentoringPreferences}
                onChange={handleChange}
                placeholder="e.g. Prefers fortnightly 1-on-1 check-ins with clear action items and accountability tracking..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Academic Standing */}
      {activeTab === 'academic' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Academic Records & Official Standing</CardTitle>
              <p className="text-xs text-slate-500">Official institutional scores managed by Registrar / Department.</p>
            </div>
            <Badge variant="info" size="sm">Official Record</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div>
                <p className="text-xs text-slate-400">Cumulative CGPA</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {profile.cgpa ? profile.cgpa.toFixed(2) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Current Semester SGPA</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {profile.sgpa ? profile.sgpa.toFixed(2) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Term Attendance %</p>
                <p className={`text-xl font-bold mt-1 ${(profile.attendancePercent || 100) < 75 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {profile.attendancePercent ? `${profile.attendancePercent.toFixed(1)}%` : '100%'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Subject-wise marks, examination grades, and course attendance percentages can be examined in full detail under the{' '}
              <a href="/mentee/academics" className="text-brand-600 font-semibold underline">
                Academic Records
              </a>{' '}
              view.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Privacy & Private Mentee Notes */}
      {activeTab === 'privacy' && (
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader>
            <div>
              <CardTitle>Privacy Controls & Private Student Journal</CardTitle>
              <p className="text-xs text-slate-500">
                This section is completely private to you. Faculty and administrators cannot view these notes.
              </p>
            </div>
            <Badge variant="warning" size="sm">Strictly Private to Student</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Share toggle */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Share Development Profile with Faculty Mentor
                </span>
                <p className="text-xs text-slate-500 max-w-xl">
                  When enabled, your assigned mentor can see your hobbies, skills, strengths, and career aspirations to tailor their guidance.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="shareWithMentor"
                  checked={formData.shareWithMentor}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* Private Notes */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Private Mentee Reflection Journal
                </label>
              </div>
              <textarea
                name="privateNotes"
                rows={5}
                value={formData.privateNotes}
                onChange={handleChange}
                placeholder="Personal reflections, private challenges, self-reminders... This text is NEVER shared with mentors or college admins."
                className="w-full text-xs p-3 rounded-xl border border-amber-300/70 dark:border-amber-700/50 bg-amber-50/20 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-400">
                Encrypted in storage and isolated from faculty workspaces.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} isLoading={saving} size="lg" leftIcon={<Save className="w-4 h-4" />}>
          Save Profile Updates
        </Button>
      </div>
    </div>
  );
};
