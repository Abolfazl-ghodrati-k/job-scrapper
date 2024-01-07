import moment  from 'moment';
// import tunnerl from 'tunnel'
// const Proxy = require('../models/Proxy');
// const { default: axios } = require('axios');

const getHashtags = (jobDescription: string) => {
    const languagesAndTechnologies = {
        python: "Python",
        android: "Android",
        java: "Java",
        csharp: "C#",
        dotnet: '.NET',
        go: "Go",
        ruby: "Ruby",
        php: "PHP",
        unity: 'Unity',
        swift: "Swift",
        kotlin: "Kotlin",
        scala: "Scala",
        sql: "SQL",
        node: "Node.js",
        nodeJs: "NodeJS",
        react: "React",
        angular: "Angular",
        vue: "Vue.js",
        express: "Express.js",
        django: "Django",
        flask: "Flask",
        tensorflow: "TensorFlow",
        pytorch: "PyTorch",
        keras: "Keras",
        pandas: "Pandas",
        numpy: "NumPy",
        scikit: "Scikit-learn",
        spark: "Apache Spark",
        bi: "BI"
    };

    // Array of labels to be excluded
    const excludeLabels = ["engineer", "developer", "programmer"];

    // Extract the programming languages and technologies mentioned in the job description
    const mentionedLanguagesAndTechnologies = Object.entries(languagesAndTechnologies)
        .filter(([_, languageOrTechnology]) => new RegExp(`\\b(${languageOrTechnology})\\b`, "i").test(jobDescription))
        .map(([_, label]) => label)
        .filter(label => !excludeLabels.includes(label.toLowerCase()));

    return mentionedLanguagesAndTechnologies
}

const sleep = (ms: number | undefined) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const convertStringToDateTime = (relativeTime: string) => {
    try {
        const timeUnits: Record<string, number> = {
            hours: 60 * 60 * 1000,
            hour: 60 * 60 * 1000,
            minutes: 60 * 1000,
            seconds: 1000,
        };
        const now = new Date();
        const timestamp = now.getTime();
        const match = /(\d+)\s+(\w+)\s+ago/.exec(relativeTime);

        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];

            const msAgo = value * timeUnits[unit];
            const adjustedTimestamp = timestamp - msAgo;
            const datetime = new Date(adjustedTimestamp);
            return datetime.toISOString().replace(/T|Z/g, ' ').trim();
        } else {
            // Handle the case where no match is found
            return moment().format('YYYY-MM-DD H:i:s');
        }
    } catch (error) {
        // Handle any other errors
        return moment().format('YYYY-MM-DD H:i:s');
    }
};


const locations = [
    {
        name: 'Netherlands',
        id: 178
    },
    {
        name: 'Finland',
        id: 79
    },
    {
        name: 'Germany',
        id: 96
    },
    {
        name: 'Sweden',
        id: 223
    },
    {
        name: 'Austria',
        id: 18
    },
    {
        name: 'Denmark',
        id: 63
    },
    {
        name: 'Norway',
        id: 180
    },
    {
        name: 'France',
        id: 86
    }
]

// const getTunnelProxy = async (_proxy) => {
//     let proxy = _proxy || await getRandomProxy();
//     let tunnelingAgent = tunnel.httpsOverHttp({
//         proxy: {
//             host: proxy.ip,
//             port: proxy.port,
//             proxyAuth: `${proxy.username}:${proxy.password}`,
//             headers: {
//                 'User-Agent': 'Node'
//             }
//         }
//     });

//     return tunnelingAgent;
// }

// const getRandomProxy = async () => {
//     let [proxy] = await Proxy.aggregate([
//         // { $match: { "enabled": 1 } },
//         { $sample: { size: 1 } }
//     ]);

//     if (!(await checkProxy(proxy))) {
//         return await getRandomProxy();
//     }

//     return proxy;
// }

// const checkProxy = async (proxy) => {
//     var tunnelingAgent = tunnel.httpsOverHttp({
//         proxy: {
//             host: proxy.ip,
//             port: proxy.port,
//             proxyAuth: `${proxy.username}:${proxy.password}`,
//             headers: {
//                 'User-Agent': 'Node'
//             }
//         }
//     });

//     try {
//         await axios.get('https://www.linkedin.com', {
//             proxy: false,
//             httpsAgent: tunnelingAgent
//         })
//     } catch (error) {
//         return false;
//     }

//     return true;
// }

export {
    getHashtags,
    sleep,
    convertStringToDateTime,
    locations,
    // getTunnelProxy,
    // getRandomProxy
}