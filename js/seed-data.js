async function seedDummyData() {
    const sb = window.supabaseClient;
    if (!sb) {
        console.error("Supabase client not found");
        return;
    }

    const dummyComplaints = [
        {
            student_name: "John Doe",
            student_id: "STU001",
            category: "Classroom",
            priority: "High",
            status: "Pending",
            title: "Broken Chair in Room 101",
            description: "The chair in the front row is broken and unsafe to use.",
            created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            student_name: "Jane Smith",
            student_id: "STU002",
            category: "Lab",
            priority: "Medium",
            status: "In Progress",
            title: "PC not starting in Lab 3",
            description: "Computer #12 is not turning on. Tried different power outlets.",
            created_at: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
            student_name: "Alex Johnson",
            student_id: "STU003",
            category: "Wi-Fi",
            priority: "High",
            status: "Pending",
            title: "Wi-Fi dead zone in Library",
            description: "The east corner of the library has no Wi-Fi signal at all.",
            created_at: new Date(Date.now() - 86400000 * 1).toISOString()
        },
        {
            student_name: "Sarah Williams",
            student_id: "STU004",
            category: "Restroom",
            priority: "Low",
            status: "Resolved",
            title: "Leaking Tap",
            description: "The tap in the 2nd floor restroom is dripping continuously.",
            created_at: new Date(Date.now() - 86400000 * 10).toISOString()
        }
    ];

    console.log("Seeding data...");
    for (const complaint of dummyComplaints) {
        try {
            const { error } = await sb.from('complaints').insert(complaint);
            if (error) throw error;
            console.log("Added:", complaint.title);
        } catch (e) {
            console.error("Error adding complaint:", e);
        }
    }
    console.log("Seeding complete!");
    alert("4 dummy complaints have been added successfully!");
}

// Run if requested
if (window.location.search.includes('seed=true')) {
    seedDummyData();
}
