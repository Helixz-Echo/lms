-- Grant all privileges to service_role for the documents table
create policy "Allow service_role to manage documents" on documents
for all
to service_role
with check (true);

-- Grant all privileges to service_role for the chunks table
create policy "Allow service_role to manage chunks" on chunks
for all
to service_role
with check (true);
