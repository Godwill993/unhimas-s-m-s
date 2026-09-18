import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  GraduationCap,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  X,
  FileCheck2,
  Calendar,
  Layers,
  KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');

  // Credentials slip modal after registration
  const [credentialsSlip, setCredentialsSlip] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: 'Male',
    contact: '',
    program_id: '',
    level: '100',
    entry_year: new Date().getFullYear(),
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [stRes, prRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/programs'),
      ]);
      setStudents(stRes.data.students || []);
      setPrograms(prRes.data.programs || []);
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('Failed to load students directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.program_id) {
      toast.error('Please select an academic program');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await api.post('/admin/students/register', formData);
      toast.success('Student registered successfully!');
      setCredentialsSlip(res.data.credentialsSlip);
      setIsRegisterOpen(false);
      setFormData({
        full_name: '',
        dob: '',
        gender: 'Male',
        contact: '',
        program_id: '',
        level: '100',
        entry_year: new Date().getFullYear(),
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesQuery =
      s.matricule?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user_profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = selectedProgram ? s.program_id === selectedProgram : true;
    return matchesQuery && matchesProgram;
  });

  const handlePrintSlip = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Student Admissions & Registration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official one-by-one student admission form with automated Matricule, Portal Password, and Results PIN generation.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsRegisterOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Register New Student
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student matricule or full name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Academic Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Student Full Name</th>
                <th className="py-3 px-4">Program & Faculty</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {st.matricule}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {st.user_profiles?.full_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {st.programs?.code}
                      </span>
                      <span className="text-slate-400 ml-1">({st.programs?.name})</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Level {st.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{st.gender}</td>
                    <td className="py-3.5 px-4 text-slate-500">{st.contact || '-'}</td>
                    <td className="py-3.5 px-4 text-right text-slate-400">{st.entry_year}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Register New Student
                </h3>
                <p className="text-xs text-slate-400">One-by-one admissions registration</p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  Full Name (as on birth certificate)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marie Claire Fotso"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="e.g. +237 670 123 456"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  Academic Program
                </label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                >
                  <option value="">Select Degree / Diploma Program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.level}] {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="100">Level 100 (Year 1 / HND 1)</option>
                    <option value="200">Level 200 (Year 2 / HND 2)</option>
                    <option value="300">Level 300 (Year 3 / Bachelor's)</option>
                    <option value="400">Level 400 (Year 4)</option>
                    <option value="500">Level 500 (Master's)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    Entry Year
                  </label>
                  <input
                    type="number"
                    value={formData.entry_year}
                    onChange={(e) => setFormData({ ...formData, entry_year: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsRegisterOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isRegistering}>
                  Generate Credentials & Register
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE CREDENTIALS SLIP MODAL */}
      {credentialsSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white text-slate-900 border border-slate-300 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Slip Top Header */}
            <div className="text-center border-b pb-4 space-y-1">
              <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center mx-auto shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 mt-2">
                {credentialsSlip.institution}
              </h2>
              <p className="text-xs text-slate-600 font-semibold">
                Official Student Registration & Access Credentials Slip
              </p>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Student Full Name:</p>
                <p className="font-bold text-slate-900 text-sm">{credentialsSlip.studentName}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Official Matricule:</p>
                <p className="font-mono font-black text-blue-700 text-base">
                  {credentialsSlip.matricule}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Program / Degree:</p>
                <p className="font-semibold text-slate-900">
                  {credentialsSlip.programName} ({credentialsSlip.programCode})
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Level & Entry Year:</p>
                <p className="font-semibold text-slate-900">
                  Level {credentialsSlip.level} &bull; {credentialsSlip.entryYear}
                </p>
              </div>
            </div>

            {/* Credentials Callout Card */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 font-bold">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>CONFIDENTIAL PORTAL & RESULTS CREDENTIALS</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-amber-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Temporary Portal Password
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm select-all">
                    {credentialsSlip.portalPassword}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Public Results PIN
                  </span>
                  <span className="font-mono font-bold text-amber-700 text-sm select-all">
                    {credentialsSlip.resultsPin}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <p>&bull; <strong>Portal Sign-in:</strong> Use Matricule (<strong>{credentialsSlip.matricule}</strong>) and the temporary password.</p>
                <p>&bull; <strong>Public Results:</strong> Enter your Matricule and Results PIN on the public check page.</p>
              </div>
            </div>

            {/* Slip Footer with signature lines */}
            <div className="pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
              <div className="space-y-6">
                <p>Student Signature</p>
                <div className="border-b border-slate-400 w-3/4 mx-auto" />
              </div>
              <div className="space-y-6">
                <p>Academic Registrar Seal & Signature</p>
                <div className="border-b border-slate-400 w-3/4 mx-auto" />
              </div>
            </div>

            {/* Action buttons (hidden on print) */}
            <div className="flex items-center justify-end space-x-2 pt-2 print:hidden">
              <Button variant="secondary" onClick={() => setCredentialsSlip(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={handlePrintSlip}>
                <Printer className="w-4 h-4 mr-1.5" />
                Print Credentials Slip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
