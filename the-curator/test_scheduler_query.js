// Test if the scheduler query works for MingPao
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScheduler() {
  console.log('Testing scheduler query for MingPao...\n');
  
  // 1. Check if MingPao source exists
  console.log('1. Checking MingPao source...');
  const { data: source, error: sourceError } = await supabase
    .from('news_sources')
    .select('id, source_key, name')
    .eq('source_key', 'mingpao')
    .single();
  
  if (sourceError) {
    console.error('❌ Error fetching source:', sourceError.message);
    return;
  }
  
  if (!source) {
    console.error('❌ MingPao source not found');
    return;
  }
  
  console.log('✅ Found source:', source);
  console.log('   ID:', source.id);
  
  // 2. Check scraper categories for MingPao
  console.log('\n2. Checking scraper_categories...');
  const { data: categories, error: catError } = await supabase
    .from('scraper_categories')
    .select('id, slug, name, priority, is_enabled, last_run_at, metadata')
    .eq('source_id', source.id)
    .eq('is_enabled', true)
    .order('priority', { ascending: false })
    .order('last_run_at', { ascending: true, nullsFirst: true });
  
  if (catError) {
    console.error('❌ Error fetching categories:', catError.message);
    return;
  }
  
  console.log(`✅ Found ${categories?.length || 0} enabled categories`);
  
  if (categories && categories.length > 0) {
    categories.forEach((cat, i) => {
      console.log(`\n   Category ${i + 1}:`);
      console.log('   - Slug:', cat.slug);
      console.log('   - Name:', cat.name);
      console.log('   - Priority:', cat.priority);
      console.log('   - Last run:', cat.last_run_at || 'Never');
      console.log('   - Metadata:', JSON.stringify(cat.metadata, null, 6));
      
      if (cat.metadata?.sectionUrl) {
        console.log('   ✅ Has sectionUrl:', cat.metadata.sectionUrl);
      } else {
        console.log('   ⚠️  Missing sectionUrl in metadata');
      }
    });
    
    console.log('\n3. Next category to process:');
    const next = categories[0];
    console.log('   Slug:', next.slug);
    console.log('   URL:', next.metadata?.sectionUrl || 'NOT FOUND');
  } else {
    console.log('❌ No enabled categories found for MingPao');
  }
}

testScheduler().catch(console.error);
