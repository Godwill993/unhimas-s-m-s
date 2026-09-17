import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { BookOpen, CheckSquare, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const TeacherMyClasses: React.FC = () => {
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAssigned() {
      try {
        const res = await api.get('/teacher/classes');
        setAssignedClasses(res.data.classes);
      } catch {
        toast.error('Failed to load assigned classes');
      } finally {
        setLoading(false);
      }
    }
    loadAssigned();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">My Assigned Classes</h2>
        <p className="text-xs text-slate-400">Select a class or subject to enter scores or record attendance</p>
      </div>

      {assignedClasses.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-semibold">No assigned classes found</p>
          <p className="text-xs text-slate-500 mt-1">Please ask your admin to assign subjects to your account.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedClasses.map((item, idx) => (
            <Card key={idx} className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-100">{item.class.name}</h3>
                  {item.class.stream && <Badge variant="info">{item.class.stream}</Badge>}
                </div>
                <div className="space-y-1.5 mt-3">
                  <p className="text-xs font-semibold text-slate-400">Assigned Subjects:</p>
                  {item.subjects.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-950/60 rounded border border-slate-800">
                      <span className="text-slate-200 font-medium">{s.name}</span>
                      <Badge variant="warning" size="sm">Coeff {s.coefficient}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <Button
                  size="sm"
                  className="flex-1 flex items-center justify-center space-x-1"
                  onClick={() => navigate(`/teacher/scores?class_id=${item.class.id}`)}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Enter Scores</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex items-center justify-center space-x-1"
                  onClick={() => navigate(`/teacher/attendance?class_id=${item.class.id}`)}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Attendance</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
