type Student = {
  id: string;
  code: string;
  first_names: string;
  paternal_surname: string;
  maternal_surname: string | null;
};

function EdgeLabel({
  letter,
  className,
}: {
  letter: string;
  className: string;
}) {
  return (
    <div
      className={`absolute flex size-16 items-center justify-center rounded-lg border-4 border-foreground text-3xl font-bold text-foreground ${className}`}
    >
      {letter}
    </div>
  );
}

export function StudentCard({
  student,
  qrDataUrl,
}: {
  student: Student;
  qrDataUrl: string;
}) {
  const fullName = `${student.first_names} ${student.paternal_surname}${
    student.maternal_surname ? ` ${student.maternal_surname}` : ""
  }`;

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center break-after-page border-b border-dashed border-border print:border-none">
      <EdgeLabel letter="A" className="top-6 left-1/2 -translate-x-1/2" />
      <EdgeLabel
        letter="C"
        className="bottom-6 left-1/2 -translate-x-1/2 rotate-180"
      />
      <EdgeLabel
        letter="D"
        className="top-1/2 left-6 -translate-y-1/2 -rotate-90"
      />
      <EdgeLabel
        letter="B"
        className="top-1/2 right-6 -translate-y-1/2 rotate-90"
      />

      <div className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={student.code} className="size-56" />
        <span className="font-mono text-lg font-medium">{student.code}</span>
        <span className="text-sm text-muted-foreground">{fullName}</span>
      </div>
    </div>
  );
}
